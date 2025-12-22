import { proxyActivities, defineSignal, setHandler, condition, workflowInfo,CancelledFailure, CancellationScope, isCancellation } from '@temporalio/workflow';
import type * as activities from '../activities';

const { createWorkItem, sendNotification, updateSystemRecord ,cancelWorkItem} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
});


const workItemCompleted = defineSignal<[number, any]>('workItemCompleted');

export interface ErrorDetails {
  errorMessage: string;
  errorCode: number;
}

export async function ExceptionWorkFlow(input: ErrorDetails): Promise<any> {
  const info = workflowInfo();
  let approvalResult: any = null;
  let workItemId: number | null = null;
try {
    await CancellationScope.cancellable(async () => {
    workItemId = await createWorkItem({
    workflowId: info.workflowId,
    runId: info.runId,
    taskType: 'Technical-Exception',
    taskName: `DeterminePenalty Exception with error code ${input.errorCode}`,
    description: 'Technical Exception occurred during penalty determination',
    priority: 'high',
    assignment: { roles: ['manager'] },
    contextData: { errocode: input.errorCode, errorMessage: input.errorMessage },
    parameters: [
      {
        name: 'request',
        direction: 'in',
        type: 'object',
        value: {  errocode: input.errorCode, errorMessage: input.errorMessage }
      },
      {
        name: 'retry',
        direction: 'inOut',
        type: 'boolean',
        mandatory: false,
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
        name: 'skiperror',
        direction: 'out',
        type: 'boolean',
        value: null
      }
    ],
    dueDate: null
  });



  
  setHandler(workItemCompleted, (id: number, data: any) => {
    if (id === workItemId) {
      approvalResult = data;
    }
  });

  await condition(() => approvalResult !== null);

    });
  return approvalResult;
} catch (e) {
    if (isCancellation(e)) {
      console.log(`Workflow ${info.workflowId} cancelled. Cleaning up work item ${workItemId}`);
      await CancellationScope.nonCancellable(() => cancelWorkItem(workItemId!));
      

    }
  }
}
