/**
 * Activities for calling the WorkItem Framework SDK
 * 
 * These activities call the SDK gRPC server.
 */

import { WorkItemClient } from '../../sdk/src/client/WorkItemClient';

interface CreateWorkItemParams {
    workflowId: string;
    runId: string;
    taskType?: string;
    taskName?: string;
    assignmentSpec?: {
        candidateUsers?: string[];
        candidateGroups?: string[];
        candidatePositions?: string[];
        strategy?: string;
        mode?: string;
    };
    lifecycle?: string;
    initiatedBy?: string;
    initiatedAt?: Date;
    parameters?: Array<{
        name: string;
        direction: 'IN' | 'OUT' | 'INOUT';
        mandatory?: boolean;
        value?: any;
    }>;
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
        // Handle initiatedAt - ensure it's a Date object
        // Temporal serializes Date objects to ISO strings, so we need to reconstruct
        const initiatedAtValue = params.initiatedAt || params.contextData?.initiatedAt;
        const initiatedAtDate = initiatedAtValue
            ? (initiatedAtValue instanceof Date ? initiatedAtValue : new Date(initiatedAtValue))
            : new Date();
            if (params.assignmentSpec) {
                params.assignmentSpec.strategy = 'OFFER_TO_ALL';
            }
        console.log("params:", params);
        
        const result = await sdkClient.createWorkItem({
            workflowId: params.workflowId,
            runId: params.runId,
            taskType: params.taskType || params.contextData?.taskType || 'HUMAN_TASK',
            taskName: params.taskName || params.contextData?.taskName || 'Work Item Task',
            description: params.contextData?.description || `Work item for ${params.workflowId}`,
            priority: params.contextData?.priority || 5,
            assignmentSpec: params.assignmentSpec || params.contextData?.assignmentSpec || {
                candidateUsers: [],
                strategy: 'DIRECT',
                mode: 'PULL' as const
            },
            lifecycle: params.lifecycle || params.contextData?.lifecycle || 'MANUAL',
            initiatedBy: params.initiatedBy || params.contextData?.initiatedBy || 'WORKFLOW',
            initiatedAt: initiatedAtDate,  // Pass the Date object
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

// ============================================
// External Service Activities (HTTP REST calls)
// ============================================

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

/**
 * Get inbox configuration from external service
 */
export async function getInboxConfig(templateId: string): Promise<any> {
    console.log(`[Activity] Getting inbox config for template: ${templateId}`);

    try {
        const response = await fetch(`${GATEWAY_URL}/api/inboxconfig/${templateId}`);

        if (!response.ok) {
            throw new Error(`Failed to get inbox config: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`[Activity] Inbox config retrieved:`, data);
        return data;
    } catch (error: any) {
        console.error(`[Activity] getInboxConfig failed:`, error.message);
        throw error;
    }
}

/**
 * Update data pool with case data
 */
export async function updateDataPool(params: {
    caseId: string;
    data: Record<string, any>;
}): Promise<any> {
    console.log(`[Activity] Updating datapool for case: ${params.caseId}`);

    try {
        const response = await fetch(`${GATEWAY_URL}/api/datapool`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            throw new Error(`Failed to update datapool: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[Activity] Datapool updated:`, result);
        return result;
    } catch (error: any) {
        console.error(`[Activity] updateDataPool failed:`, error.message);
        throw error;
    }
}

/**
 * Log audit event
 */
export async function logAuditEvent(params: {
    caseId: string;
    event: string;
    data: Record<string, any>;
}): Promise<any> {
    console.log(`[Activity] Logging audit event: ${params.event} for case: ${params.caseId}`);

    try {
        const response = await fetch(`${GATEWAY_URL}/api/auditlog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            throw new Error(`Failed to log audit event: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[Activity] Audit event logged:`, result);
        return result;
    } catch (error: any) {
        console.error(`[Activity] logAuditEvent failed:`, error.message);
        throw error;
    }
}

/**
 * Call subprocess (placeholder - implement based on your subprocess logic)
 */
export async function callSubprocess(params: {
    caseId: string;
    payload?: any;
}): Promise<void> {
    console.log(`[Activity] Calling subprocess for case: ${params.caseId}`);

    // This is a placeholder - implement your subprocess logic here
    // Could be:
    // - Starting a child workflow
    // - Calling another external service
    // - Executing a different workflow

    await logAuditEvent({
        caseId: params.caseId,
        event: 'SUBPROCESS_INVOKED',
        data: {
            payload: params.payload,
            timestamp: new Date().toISOString()
        }
    });

    console.log(`[Activity] Subprocess completed for case: ${params.caseId}`);
}
