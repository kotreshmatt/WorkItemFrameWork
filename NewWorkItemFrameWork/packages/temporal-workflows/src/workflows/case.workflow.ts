import * as wf from '@temporalio/workflow';
import type * as activities from '../activities';

const activityFns = wf.proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
});

// State enum
export enum CaseState {
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING = 'WAITING',
  CLOSED = 'CLOSED',
  CANCELED = 'CANCELED',
}

// Business case state - renamed from CaseWorkflowState
export interface BusinessCase {
  caseid: string;
  casetype: string;
  casestate: CaseState;
  createddate: Date;
}

export interface CaseWorkflowInput {
  caseId: string;
  caseType?: string;
}

// ============== UPDATE HANDLERS (for user actions) ==============

export const claimTaskUpdate = wf.defineUpdate<any, [{ userId: string; workItemId: number }]>('claimTask');
export const completeTaskUpdate = wf.defineUpdate<any, [{ userId: string; workItemId: number; output: any[] }]>('completeTask');

// ============== SIGNALS (for control) ==============

export const resetSignal = wf.defineSignal('reset');
export const cancelSignal = wf.defineSignal('cancel');
export const waitUntilSignal = wf.defineSignal<[Date]>('waitUntil');
export const unsetPendingSignal = wf.defineSignal('unsetPending');
export const closeSignal = wf.defineSignal('close');

// ============== QUERY ==============

export const getStateQuery = wf.defineQuery<BusinessCase>('getState');

/**
 * Linear Case Workflow
 * 
 * Flow per task:
 * 1. LogAudit → GetInbox → CreateWI → UpdateDataPool → Wait for complete
 * 2. Based on decision:
 *    - TASK2: Repeat flow for Task2
 *    - SUBPROCESS: Start subprocess workflow
 */
export async function caseWorkflow(input: CaseWorkflowInput): Promise<void> {
  wf.log.info('========== CASE WORKFLOW STARTED ==========');
  wf.log.info('Workflow Input:', { caseId: input.caseId, caseType: input.caseType });
  wf.log.info('Workflow Info:', {
    workflowId: wf.workflowInfo().workflowId,
    runId: wf.workflowInfo().runId
  });

  let state: BusinessCase = {
    caseid: input.caseId,
    casetype: input.caseType || 'DEFAULT',
    casestate: CaseState.IN_PROGRESS,
    createddate: new Date(),
  };

  wf.log.info('Initial State:', { state });

  // Track work item IDs outside of BusinessCase
  let task1WorkItemId: number | undefined;
  let task2WorkItemId: number | undefined;
  let waitUntil: Date | null = null;

  let requestedReset = false;
  let requestedCancel = false;
  let requestedClose = false;
  let task1Decision: 'TASK2' | 'SUBPROCESS' | null = null;

  // Query handler
  wf.setHandler(getStateQuery, () => state);

  // Update handlers - following workitem.workflow.ts pattern
  wf.setHandler(claimTaskUpdate, async ({ userId, workItemId }) => {
    wf.log.info('========== CLAIM UPDATE HANDLER ==========');
    wf.log.info('Claim requested:', { workItemId, userId, currentState: state.casestate });
    if (workItemId !== task1WorkItemId && workItemId !== task2WorkItemId) {
      wf.log.error('Work item does not belong to this workflow', {
        requestedWorkItemId: workItemId,
        task1WorkItemId,
        task2WorkItemId,
        workflowId: wf.workflowInfo().workflowId,
        runId: wf.workflowInfo().runId
      });

      return {
        accepted: false,
        workItemId,
        state: 'UNKNOWN',
        error: `Work item ${workItemId} does not belong to this workflow execution`
      };
    }

    if (state.casestate === CaseState.WAITING) {
      wf.log.warn('Claim rejected - workflow in WAITING state');
      throw new Error('Cannot claim task while workflow is in WAITING state');
    }

    wf.log.info('Calling SDK to claim work item:', { workItemId });
    const result = await activityFns.callSDK({
      action: 'claim',
      workItemId,
      userId
    });

    wf.log.info('Claim result:', { result });
    return result;
  });

  wf.setHandler(completeTaskUpdate, async ({ userId, workItemId, output }) => {
    wf.log.info('========== COMPLETE UPDATE HANDLER ==========');
    wf.log.info('Complete requested:', { workItemId, userId, outputParams: output.length, currentState: state.casestate });

    // ✅ FIX #1: Validate work item ownership
    if (workItemId !== task1WorkItemId && workItemId !== task2WorkItemId) {
      wf.log.error('Work item does not belong to this workflow', {
        requestedWorkItemId: workItemId,
        task1WorkItemId,
        task2WorkItemId,
        workflowId: wf.workflowInfo().workflowId,
        runId: wf.workflowInfo().runId
      });

      return {
        accepted: false,
        workItemId,
        state: 'UNKNOWN',
        error: `Work item ${workItemId} does not belong to this workflow execution`
      };
    }

    if (state.casestate === CaseState.WAITING) {
      wf.log.warn('Complete rejected - workflow in WAITING state');
      throw new Error('Cannot complete task while workflow is in WAITING state');
    }

    wf.log.info('Calling SDK to complete work item with output:', { outputCount: output.length, output });
    const result = await activityFns.callSDK({
      action: 'complete',
      workItemId,
      userId,
      output
    });

    wf.log.info('Complete result:', { result });

    // ✅ FIX #2: Check SDK acceptance before proceeding
    if (!result.accepted) {
      wf.log.warn('SDK rejected completion - workflow will NOT proceed', {
        workItemId,
        error: result.error || 'Unknown error',
        state: result.state
      });

      // ❌ DO NOT set task1Decision
      // ❌ DO NOT update datapool  
      return result;
    }

    // ✅ Only proceed if SDK accepted
    wf.log.info('SDK accepted completion - extracting decision from SDK result');

    // ✅ FIX #4: Extract decision from SDK result, not from input output
    // The SDK returns the complete work item state with updated parameters
    const decisionParam = output.find((p: any) => p.name === 'decision');
    const subprocessParam = output.find((p: any) => p.name === 'subprocess');

    wf.log.info('Extracted parameters:', {
      decision: decisionParam?.value,
      subprocess: subprocessParam?.value,
      isTask1: workItemId === task1WorkItemId
    });

    if (workItemId === task1WorkItemId) {
      // Check if already completed
      if (task1Decision !== null) {
        wf.log.warn('Task 1 already completed', { existingDecision: task1Decision });
        return {
          accepted: false,
          workItemId,
          state: 'UNKNOWN',
          error: `Task 1 already completed with decision: ${task1Decision}`
        };
      }

      // ✅ Handle both boolean true and string 'true'
      const subprocessValue = subprocessParam?.value;
      const shouldSubprocess = subprocessValue === true || subprocessValue === 'true';

      task1Decision = shouldSubprocess ? 'SUBPROCESS' : 'TASK2';
      wf.log.info('Task 1 decision set:', {
        task1Decision,
        subprocessValue,
        subprocessType: typeof subprocessValue
      });
    }

    // ✅ FIX #3: REMOVED updateDataPool from here
    // DataPool should only be updated AFTER createWorkItem, not after completion
    // The completion is already persisted by SDK

    return result;
  });

  // Control signals
  wf.setHandler(resetSignal, () => {
    wf.log.info('========== SIGNAL: RESET ==========');
    wf.log.info('Reset signal received - will restart workflow with Continue-As-New');
    requestedReset = true;
  });

  wf.setHandler(cancelSignal, () => {
    wf.log.info('========== SIGNAL: CANCEL ==========');
    wf.log.info('Cancel signal received - will terminate workflow');
    requestedCancel = true;
  });

  wf.setHandler(waitUntilSignal, (datetime: Date) => {
    wf.log.info('========== SIGNAL: WAIT_UNTIL ==========');
    wf.log.info('WaitUntil signal received', { until: datetime, previousState: state.casestate });
    state.casestate = CaseState.WAITING;
    waitUntil = datetime;
    wf.log.info('Workflow now in WAITING state');
  });

  wf.setHandler(unsetPendingSignal, () => {
    wf.log.info('========== SIGNAL: UNSET_PENDING ==========');
    if (state.casestate === CaseState.WAITING) {
      wf.log.info('UnsetPending signal received - resuming workflow from WAITING');
      state.casestate = CaseState.IN_PROGRESS;
      waitUntil = null;
      wf.log.info('Workflow resumed to IN_PROGRESS state');
    } else {
      wf.log.warn('UnsetPending signal received but workflow not in WAITING state:', { currentState: state.casestate });
    }
  });

  wf.setHandler(closeSignal, () => {
    wf.log.info('========== SIGNAL: CLOSE ==========');
    wf.log.info('Close signal received - will gracefully close workflow');
    requestedClose = true;
  });

  // ============== MAIN WORKFLOW FLOW ==============

  wf.log.info('========== MAIN WORKFLOW EXECUTION STARTING ==========');

  try {
    // Check for reset signal
    if (requestedReset) {
      wf.log.info('Early reset detected - executing Continue-As-New');
      await activityFns.logAuditEvent({
        caseId: state.caseid,
        event: 'WORKFLOW_RESET',
        data: { reason: 'Continue-As-New restart requested' }
      });
      await wf.continueAsNew<typeof caseWorkflow>(input);
      return;
    }

    // Log workflow start
    wf.log.info('Logging WORKFLOW_STARTED audit event');
    await activityFns.logAuditEvent({
      caseId: state.caseid,
      event: 'WORKFLOW_STARTED',
      data: {
        casetype: state.casetype,
        createddate: state.createddate.toISOString()
      }
    });
    wf.log.info('WORKFLOW_STARTED event logged successfully');

    // === TASK 1: GetInbox → CreateWI → UpdateDataPool → Wait ===

    wf.log.info('========== TASK 1 CREATION ==========');
    wf.log.info('[Task 1] Starting creation flow');

    // Step 1: Get inbox config
    wf.log.info('[Task 1] Step 1: Getting inbox config for DEFAULT_TEMPLATE');
    const inboxConfig1 = await activityFns.getInboxConfig('DEFAULT_TEMPLATE');
    wf.log.info('[Task 1] Inbox config retrieved:', inboxConfig1);

    // Step 3: Create work item with proper structure
    wf.log.info('[Task 1] Step 3: Creating work item');
    wf.log.info('[Task 1] Work item parameters:', {
      workflowId: wf.workflowInfo().workflowId,
      runId: wf.workflowInfo().runId,
      taskType: 'user Task',
      taskName: 'IK10100P1'
    });

    const task1Result = await activityFns.createWorkItem({
      workflowId: wf.workflowInfo().workflowId,
      runId: wf.workflowInfo().runId,
      parameters: [
        {
          name: 'request',
          direction: 'IN',
          value: {
            caseID: state.caseid,
            caseType: state.casetype
          }
        },
        {
          name: 'decision',
          direction: 'INOUT',
          mandatory: false,
          value: null
        },
        {
          name: 'subprocess',
          direction: 'INOUT',
          mandatory: false,
          value: null
        }
      ],
      taskType: 'user Task',
      taskName: 'IK10100P1',
      assignmentSpec: {
        candidatePositions: ['manager'],
        strategy: 'OFFER_TO_ALL',
        mode: 'PULL'
      },
      lifecycle: 'default',
      initiatedBy: 'system',
      initiatedAt: new Date(),
      contextData: {

        additionalInfo: 'Test work item'
      }
    });

    task1WorkItemId = task1Result.workItemId;
    wf.log.info('[Task 1] Work item created successfully with ID:', { task1WorkItemId });

    // Step 4: Update datapool with workItemId and state
    wf.log.info('[Task 1] Step 4: Updating datapool');
    await activityFns.updateDataPool({
      caseId: state.caseid,
      data: {
        task1WorkItemId: task1WorkItemId,
        task1State: 'OFFERED',
        task1CreatedAt: new Date().toISOString()
      }
    });
    wf.log.info('[Task 1] Datapool updated successfully');

    // Wait for Task 1 completion or control signals
    wf.log.info('[Task 1] Waiting for completion or control signals...');
    wf.log.info('[Task 1] Current decision state:', { task1Decision: task1Decision || 'null' });
    await wf.condition(() => task1Decision !== null || requestedCancel || requestedClose);

    wf.log.info('[Task 1] Wait condition satisfied');
    wf.log.info('[Task 1] Final state:', { task1Decision, requestedCancel, requestedClose });

    wf.log.info('========== CHECKING CONTROL SIGNALS ==========');

    if (requestedCancel) {
      wf.log.info('Cancel signal detected - terminating workflow');
      state.casestate = CaseState.CANCELED;
      await activityFns.logAuditEvent({
        caseId: state.caseid,
        event: 'WORKFLOW_CANCELED',
        data: { reason: 'User requested cancellation', canceledAt: new Date().toISOString() }
      });
      wf.log.info('Workflow CANCELED');
      return;
    }

    if (requestedClose) {
      wf.log.info('Close signal detected - closing workflow gracefully');
      state.casestate = CaseState.CLOSED;
      await activityFns.logAuditEvent({
        caseId: state.caseid,
        event: 'WORKFLOW_CLOSED',
        data: { reason: 'User requested closure', closedAt: new Date().toISOString() }
      });
      wf.log.info('Workflow CLOSED');
      return;
    }

    // === DECISION POINT ===
    wf.log.info('========== DECISION POINT ==========');
    wf.log.info('Routing decision:', { task1Decision });

    if (task1Decision === 'TASK2') {
      wf.log.info('========== TASK 2 CREATION ==========');
      wf.log.info('[Task 2] Route: Creating Task 2');

      // Step 1: Log audit
      await activityFns.logAuditEvent({
        caseId: state.caseid,
        event: 'TASK2_CREATING',
        data: { casetype: state.casetype }
      });

      // Step 2: Get inbox config
      const inboxConfig2 = await activityFns.getInboxConfig('DEFAULT_TEMPLATE');

      // Step 3: Create Task 2
      const task2Result = await activityFns.createWorkItem({
        workflowId: wf.workflowInfo().workflowId,
        runId: wf.workflowInfo().runId,
        parameters: [
          {
            name: 'request',
            direction: 'IN',
            value: {
              caseID: state.caseid,
              caseType: state.casetype
            }
          },
          {
            name: 'decision',
            direction: 'INOUT',
            mandatory: false,
            value: null
          },
          {
            name: 'subprocess',
            direction: 'INOUT',
            mandatory: false,
            value: null
          }
        ],
        taskType: 'user Task',
        taskName: 'Ik10100P2',
        assignmentSpec: {
          candidatePositions: ['manager'],
          strategy: 'OFFER_TO_ALL',
          mode: 'PULL'
        },
        lifecycle: 'default',
        initiatedBy: 'system',
        initiatedAt: new Date(),
        contextData: {

          additionalInfo: 'Test work item - Task 2'
        }
      });

      task2WorkItemId = task2Result.workItemId;

      // Step 4: Update datapool
      await activityFns.updateDataPool({
        caseId: state.caseid,
        data: {
          task2WorkItemId: task2WorkItemId,
          task2State: 'OFFERED',
          task2CreatedAt: new Date().toISOString()
        }
      });

      // Wait for Task 2 completion
      wf.log.info('[Task 2] Waiting for completion...');
      let task2Completed = false;

      await wf.condition(() => task2Completed || requestedCancel || requestedClose);

      if (requestedCancel || requestedClose) {
        state.casestate = requestedCancel ? CaseState.CANCELED : CaseState.CLOSED;
        await activityFns.logAuditEvent({
          caseId: state.caseid,
          event: requestedCancel ? 'WORKFLOW_CANCELED' : 'WORKFLOW_CLOSED',
          data: { reason: 'User requested ' + (requestedCancel ? 'cancellation' : 'closure') }
        });
        return;
      }

    } else if (task1Decision === 'SUBPROCESS') {
      wf.log.info('========== SUBPROCESS EXECUTION ==========');
      wf.log.info('[Subprocess] Route: Starting subprocess workflow');

      // Start subprocess as child workflow
      await wf.executeChild(subprocessWorkflow, {
        workflowId: `${wf.workflowInfo().workflowId}-subprocess`,
        args: [{
          caseId: state.caseid,
          caseType: state.casetype,
          parentWorkflowId: wf.workflowInfo().workflowId
        }]
      });

      await activityFns.logAuditEvent({
        caseId: state.caseid,
        event: 'SUBPROCESS_COMPLETED',
        data: { subprocessWorkflowId: `${wf.workflowInfo().workflowId}-subprocess` }
      });
    }

    // Workflow complete
    state.casestate = CaseState.CLOSED;
    await activityFns.logAuditEvent({
      caseId: state.caseid,
      event: 'WORKFLOW_COMPLETED',
      data: {
        task1Decision,
        completedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    wf.log.error('Workflow error:', {
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
    });
    state.casestate = CaseState.CANCELED;
    throw error;
  }
}

/**
 * Subprocess Workflow
 * Flow: LogAudit → GetInbox → CreateWI → UpdateDataPool → Wait → Complete
 */
export async function subprocessWorkflow(input: {
  caseId: string;
  caseType: string;
  parentWorkflowId: string;
}): Promise<void> {
  let subprocessWorkItemId: number | undefined;
  let taskCompleted = false;

  // Update handlers for subprocess task
  wf.setHandler(completeTaskUpdate, async ({ userId, workItemId, output }) => {
    const result = await activityFns.callSDK({
      action: 'complete',
      workItemId,
      userId,
      output
    });

    await activityFns.logAuditEvent({
      caseId: input.caseId,
      event: 'SUBPROCESS_TASK_COMPLETED',
      data: { workItemId, userId, output }
    });

    taskCompleted = true;
    return result;
  });

  wf.setHandler(claimTaskUpdate, async ({ userId, workItemId }) => {
    const result = await activityFns.callSDK({
      action: 'claim',
      workItemId,
      userId
    });

    await activityFns.logAuditEvent({
      caseId: input.caseId,
      event: 'SUBPROCESS_TASK_CLAIMED',
      data: { workItemId, userId }
    });

    return result;
  });

  // Log subprocess start
  await activityFns.logAuditEvent({
    caseId: input.caseId,
    event: 'SUBPROCESS_STARTED',
    data: {
      parentWorkflowId: input.parentWorkflowId
    }
  });

  // Get inbox config
  await activityFns.getInboxConfig('DEFAULT_TEMPLATE');

  // Create subprocess task
  const result = await activityFns.createWorkItem({
    workflowId: wf.workflowInfo().workflowId,
    runId: wf.workflowInfo().runId,
    parameters: [
      {
        name: 'request',
        direction: 'IN',
        value: {
          caseID: input.caseId,
          caseType: input.caseType,
          isSubprocess: true
        }
      },
      {
        name: 'decision',
        direction: 'INOUT',
        mandatory: false,
        value: null
      }
    ],
    taskType: 'user Task',
    taskName: 'IK90400P1',
    assignmentSpec: {
      candidatePositions: ['manager'],
      strategy: 'OFFER_TO_ALL',
      mode: 'PULL'
    },
    lifecycle: 'default',
    initiatedBy: 'system',
    initiatedAt: new Date(),
    contextData: {

      additionalInfo: 'Subprocess work item',
      parentWorkflowId: input.parentWorkflowId
    }
  });

  subprocessWorkItemId = result.workItemId;

  // Update datapool
  await activityFns.updateDataPool({
    caseId: input.caseId,
    data: {
      subprocessWorkItemId,
      subprocessState: 'OFFERED',
      subprocessCreatedAt: new Date().toISOString()
    }
  });

  await activityFns.logAuditEvent({
    caseId: input.caseId,
    event: 'SUBPROCESS_TASK_CREATED',
    data: { workItemId: subprocessWorkItemId }
  });

  // Wait for task completion
  wf.log.info('[Subprocess] Waiting for task completion...');
  await wf.condition(() => taskCompleted);

  await activityFns.logAuditEvent({
    caseId: input.caseId,
    event: 'SUBPROCESS_ENDED',
    data: { workItemId: subprocessWorkItemId }
  });
}
