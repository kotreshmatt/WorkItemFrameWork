/**
 * Activities for calling the WorkItem Framework SDK
 * 
 * These activities call the SDK gRPC server.
 */

import { WorkItemClient } from '../../sdk/src/client/WorkItemClient';

interface CreateWorkItemParams {
    workflowId: string;
    runId: string;
    parameters?: any[];
    contextData?: Record<string, any>;
}

interface SDKCallParams {
    action: 'claim' | 'complete' | 'cancel';
    workItemId: number;
    userId: string;
    output?: any[];
    reason?: string;
}

// Initialize SDK client (reused across activity calls)
const sdkClient = new WorkItemClient({
    address: process.env.SDK_SERVER_ADDRESS || 'localhost:50051'
});

/**
 * Create a work item via SDK
 * 
 * This activity is called at the start of the workflow to create the work item.
 */
export async function createWorkItem(params: CreateWorkItemParams): Promise<{ workItemId: number }> {
    console.log(`[Activity] createWorkItem for workflow ${params.workflowId}, run ${params.runId}`);

    try {
        const result = await sdkClient.createWorkItem({
            workflowId: params.workflowId,
            runId: params.runId,
            taskType: params.contextData?.taskType || 'HUMAN_TASK',
            taskName: params.contextData?.taskName || 'Work Item Task',
            description: params.contextData?.description || `Work item for ${params.workflowId}`,
            priority: params.contextData?.priority || 5,
            assignmentSpec: params.contextData?.assignmentSpec || {
                candidateUsers: [],
                strategy: 'DIRECT',
                mode: 'PULL' as const
            },
            lifecycle: params.contextData?.lifecycle || 'MANUAL',
            initiatedBy: params.contextData?.initiatedBy || 'WORKFLOW',
            parameters: params.parameters || [],
            contextData: params.contextData || {}
        });

        console.log(`[Activity] Work item created with ID:`, result.workItemId);
        return { workItemId: result.workItemId };
    } catch (error: any) {
        console.error(`[Activity] createWorkItem failed:`, error.message);
        throw error;
    }
}

/**
 * Call the WorkItem SDK via gRPC
 * 
 * This activity calls the actual SDK client to perform work item operations.
 */
export async function callSDK(params: SDKCallParams): Promise<any> {
    console.log(`[Activity] callSDK: ${params.action} for workItem ${params.workItemId} by user ${params.userId}`);

    try {
        let result;

        switch (params.action) {
            case 'claim':
                result = await sdkClient.claimWorkItem({
                    workItemId: params.workItemId,
                    actorId: params.userId
                });
                console.log(`[Activity] Claim result:`, result);
                return result;

            case 'complete':
                result = await sdkClient.completeWorkItem({
                    workItemId: params.workItemId,
                    actorId: params.userId,
                    output: params.output || []
                });
                console.log(`[Activity] Complete result:`, result);
                return result;

            case 'cancel':
                result = await sdkClient.cancelWorkItem({
                    workItemId: params.workItemId,
                    actorId: params.userId,
                    reason: params.reason || ''
                });
                console.log(`[Activity] Cancel result:`, result);
                return result;

            default:
                throw new Error(`Unknown action: ${params.action}`);
        }
    } catch (error: any) {
        console.error(`[Activity] SDK call failed:`, error.message);
        throw error;
    }
}
