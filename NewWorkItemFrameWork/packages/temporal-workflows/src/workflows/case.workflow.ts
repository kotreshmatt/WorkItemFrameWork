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
  let state: BusinessCase = {
    caseid: input.caseId,
    casetype: input.caseType || 'DEFAULT',
    casestate: CaseState.IN_PROGRESS,
    createddate: new Date(),
  };

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
    if (state.casestate === CaseState.WAITING) {
      throw new Error('Cannot claim task while workflow is in WAITING state');
    }

    wf.log.info(`[Workflow] Claim update received for work item ${workItemId} by ${userId}`);

    return await activityFns.callSDK({
      action: 'claim',
      workItemId,
      userId
    });
  });

  wf.setHandler(completeTaskUpdate, async ({ userId, workItemId, output }) => {
    if (state.casestate === CaseState.WAITING) {
      throw new Error('Cannot complete task while workflow is in WAITING state');
    }

    wf.log.info(`[Workflow] Complete update received for work item ${workItemId} by ${userId}`);

    const result = await activityFns.callSDK({
      action: 'complete',
      workItemId,
      userId,
      output
    });

    // Extract decision from output parameters
    const decisionParam = output.find((p: any) => p.name === 'decision');
    const subprocessParam = output.find((p: any) => p.name === 'subprocess');

    if (workItemId === task1WorkItemId) {
      task1Decision = subprocessParam?.value === true ? 'SUBPROCESS' : 'TASK2';
    }

    await activityFns.updateDataPool({
      caseId: state.caseid,
      data: {
        [`task${workItemId === task1WorkItemId ? 1 : 2}CompletedAt`]: new Date().toISOString(),
        [`task${workItemId === task1WorkItemId ? 1 : 2}CompletedBy`]: userId,
        [`task${workItemId === task1WorkItemId ? 1 : 2}Decision`]: decisionParam?.value
      }
    });

    return result;
  });

  // Control signals
  wf.setHandler(resetSignal, () => {
    wf.log.info('Reset signal received - will restart workflow with Continue-As-New');
    requestedReset = true;
  });

  wf.setHandler(cancelSignal, () => {
    wf.log.info('Cancel signal received');
    requestedCancel = true;
  });

  wf.setHandler(waitUntilSignal, (datetime: Date) => {
    wf.log.info('WaitUntil signal received', { until: datetime });
    state.casestate = CaseState.WAITING;
    waitUntil = datetime;
  });

  wf.setHandler(unsetPendingSignal, () => {
    if (state.casestate === CaseState.WAITING) {
      wf.log.info('UnsetPending signal received - resuming workflow');
      state.casestate = CaseState.IN_PROGRESS;
      waitUntil = null;
    }
  });

  wf.setHandler(closeSignal, () => {
    wf.log.info('Close signal received');
    requestedClose = true;
  });

  // ============== MAIN WORKFLOW FLOW ==============

  try {
    // Check for reset signal
    if (requestedReset) {
      wf.log.info('Resetting workflow using Continue-As-New');
      await activityFns.logAuditEvent({
        caseId: state.caseid,
        event: 'WORKFLOW_RESET',
        data: { reason: 'Continue-As-New restart requested' }
      });
      await wf.continueAsNew<typeof caseWorkflow>(input);
      return;
    }

    // Log workflow start
    await activityFns.logAuditEvent({
      caseId: state.caseid,
      event: 'WORKFLOW_STARTED',
      data: {
        casetype: state.casetype,
        createddate: state.createddate.toISOString()
      }
    });

    // === TASK 1: LogAudit → GetInbox → CreateWI → UpdateDataPool → Wait ===

    wf.log.info('[Task 1] Creating');

    // Step 1: Log audit
    await activityFns.logAuditEvent({
      caseId: state.caseid,
      event: 'TASK1_CREATING',
      data: { casetype: state.casetype }
    });

    // Step 2: Get inbox config
    const inboxConfig1 = await activityFns.getInboxConfig('DEFAULT_TEMPLATE');

    // Step 3: Create work item with proper structure
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

    // Step 4: Update datapool with workItemId and state
    await activityFns.updateDataPool({
      caseId: state.caseid,
      data: {
        task1WorkItemId: task1WorkItemId,
        task1State: 'OFFERED',
        task1CreatedAt: new Date().toISOString()
      }
    });

    // Wait for Task 1 completion or control signals
    wf.log.info('[Task 1] Waiting for completion...');
    await wf.condition(() => task1Decision !== null || requestedCancel || requestedClose);

    if (requestedCancel) {
      state.casestate = CaseState.CANCELED;
      await activityFns.logAuditEvent({
        caseId: state.caseid,
        event: 'WORKFLOW_CANCELED',
        data: { reason: 'User requested cancellation' }
      });
      return;
    }

    if (requestedClose) {
      state.casestate = CaseState.CLOSED;
      await activityFns.logAuditEvent({
        caseId: state.caseid,
        event: 'WORKFLOW_CLOSED',
        data: { reason: 'User requested closure' }
      });
      return;
    }

    // === DECISION POINT ===

    if (task1Decision === 'TASK2') {
      wf.log.info('[Task 2] Creating');

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
      wf.log.info('[Subprocess] Starting');

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
