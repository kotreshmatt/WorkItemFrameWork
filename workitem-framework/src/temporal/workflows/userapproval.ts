import { proxyActivities, defineSignal, setHandler, condition, workflowInfo, CancelledFailure, CancellationScope, isCancellation } from '@temporalio/workflow';
import type * as activities from '../activities';

const { createWorkItem, sendNotification, updateSystemRecord, cancelWorkItem } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
});

// Temporal signals
const workItemCompleted = defineSignal<[number, any]>('workItemCompleted');
// To handle cancellation of work item in case of workflow termination
const cancelWorkItemSignal = defineSignal<[number]>('cancelWorkItem');

export interface ReimbursementInput {
  employeeName: string;
  amount: number;
}

export async function ReimbursementWorkflow(input: ReimbursementInput): Promise<any> {
  const info = workflowInfo();
  let approvalResult: any = null;
  let workItemId: number | null = null;
  try {
    await CancellationScope.cancellable(async () => {
      workItemId = await createWorkItem({
        workflowId: info.workflowId,
        runId: info.runId,
        taskType: 'manager-approval',
        taskName: `Approve reimbursement for ${input.employeeName}`,
        description: 'Please approve reimbursement',
        priority: 'high',
        assignment: { userIds: ['manager1'] },
        contextData: { employeeName: input.employeeName, amount: input.amount },
        parameters: [
          {
            name: 'request',
            direction: 'in',
            type: 'object',
            value: { employeeName: input.employeeName, amount: input.amount }
          },
          {
            name: 'approved',
            direction: 'inOut',
            type: 'boolean',
            mandatory: true,
            value: null
          },
          {
            name: 'comments',
            direction: 'inOut',
            type: 'string',
            mandatory: false,
            value: null
          },
          {
            name: 'approvedAt',
            direction: 'out',
            type: 'string',
            value: null
          }
        ],
        dueDate: null
      });

      await sendNotification({
        userIds: ['manager1'],
        message: `Approval required: ${workItemId}`
      });

      // 
      setHandler(workItemCompleted, (id: number, data: any) => {
        if (id === workItemId) {
          approvalResult = data;
        }
      });

      await condition(() => approvalResult !== null);

      // post-approval
      await updateSystemRecord({
        workflowId: info.workflowId,
        workItemId,
        approvalResult
      });
    });
    return approvalResult;
  } catch (e) {
    if (isCancellation(e)) {
      console.log(`Workflow ${info.workflowId} cancelled. Cleaning up work item ${workItemId}`);
      await CancellationScope.nonCancellable(() => cancelWorkItem(workItemId!));
      

    }
  }
}



