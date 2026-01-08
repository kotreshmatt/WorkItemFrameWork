import { defineUpdate, setHandler, condition, proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { createWorkItem: createWorkItemActivity, callSDK } = proxyActivities<typeof activities>({
    startToCloseTimeout: '10 seconds',
});

// Define update handlers - these are RPC methods the workflow exposes
export const claimWorkItem = defineUpdate<any, [{ workItemId: number; userId: string }]>('claimWorkItem');
export const completeWorkItem = defineUpdate<any, [{ workItemId: number; userId: string; output: any[] }]>('completeWorkItem');
export const cancelWorkItem = defineUpdate<any, [{ workItemId: number; userId: string; reason: string }]>('cancelWorkItem');

export interface WorkItemWorkflowInput {
    caseId: string;
}

/**
 * Exception Handling Workflow
 * 
 * This workflow demonstrates a technical exception handling process:
 * 1. Creates a work item with predefined structure (design-time data)
 * 2. Waits for external app to claim/complete/cancel via Gateway
 * 3. Each update delegates to SDK via activities
 */
export async function workItemWorkflow(input: WorkItemWorkflowInput): Promise<void> {
    // Step 1: Create the work item with design-time data
    const workflowName = 'exception-handling-wf';
    const runId = `run-${Date.now()}`;
    const temporalWorkflowId = `${workflowName}-${input.caseId}`;

    console.log(`[Workflow] Creating work item for ${temporalWorkflowId}`);

    // Work Item Definition - This is design-time data (like BPMN task definition)
    const { workItemId } = await createWorkItemActivity({
        workflowId: temporalWorkflowId,
        runId: runId,
        parameters: [
            {
                name: 'request',
                direction: 'IN',
                value: { errorCode: 'ERROR_CODE', errorMessage: 'Error message' }
            },
            {
                name: 'retry',
                direction: 'INOUT',
                mandatory: false,
                value: null
            },
            {
                name: 'comments',
                direction: 'INOUT',
                mandatory: false,
                value: null
            },
            {
                name: 'skipError',
                direction: 'OUT',
                value: null
            }
        ],
        contextData: {
            taskType: 'Technical-Exception',
            taskName: 'Handle Exception',
            description: `Handle technical exception for case ${input.caseId}`,
            priority: 8,
            assignmentSpec: {
                candidatePositions: ['manager'],
                strategy: 'OFFER_TO_ALL',
                mode: 'PULL'
            },
            lifecycle: 'default',
            initiatedBy: 'system',
            additionalInfo: `Exception for case ${input.caseId}`
        }
    });

    console.log(`[Workflow] Work item ${workItemId} created successfully`);

    // Step 2: Register update handlers (called by Gateway from external apps)
    setHandler(claimWorkItem, async ({ userId }) => {
        console.log(`[Workflow] Claim update received for work item ${workItemId} by ${userId}`);
        return await callSDK({
            action: 'claim',
            workItemId,
            userId
        });
    });

    setHandler(completeWorkItem, async ({ userId, output }) => {
        console.log(`[Workflow] Complete update received for work item ${workItemId} by ${userId}`);
        return await callSDK({
            action: 'complete',
            workItemId,
            userId,
            output
        });
    });

    setHandler(cancelWorkItem, async ({ userId, reason }) => {
        console.log(`[Workflow] Cancel update received for work item ${workItemId} by ${userId}`);
        return await callSDK({
            action: 'cancel',
            workItemId,
            userId,
            reason
        });
    });

    // Step 3: Keep workflow alive to receive updates from external apps via Gateway
    console.log(`[Workflow] Work item ${workItemId} ready, waiting for updates...`);
    await condition(() => false);
}
