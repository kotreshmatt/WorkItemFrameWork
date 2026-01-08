import { Client, Connection } from '@temporalio/client';
import { workItemWorkflow } from './workitem.workflow';

interface WorkflowStartConfig {
    temporalAddress?: string;
    taskQueue?: string;
}

/**
 * Temporal Workflow Client
 * 
 * Use this to start workflows (creates work items)
 */
export class WorkflowClient {
    private config: WorkflowStartConfig;

    constructor(config?: WorkflowStartConfig) {
        this.config = {
            temporalAddress: config?.temporalAddress || process.env.TEMPORAL_ADDRESS || 'localhost:7233',
            taskQueue: config?.taskQueue || 'workitem-queue'
        };
    }

    /**
     * Start a new workflow instance
     * 
     * This will create a work item in the framework
     */
    async startWorkflow(caseId: string): Promise<{ workflowId: string; runId: string }> {
        const connection = await Connection.connect({
            address: this.config.temporalAddress
        });

        const client = new Client({ connection });
        const workflowId = `exception-handling-wf-${caseId}`;

        console.log(`[Client] Starting workflow: ${workflowId}`);

        const handle = await client.workflow.start(workItemWorkflow, {
            taskQueue: this.config.taskQueue!,
            workflowId: workflowId,
            args: [{ caseId }]
        });

        console.log(`[Client] Workflow started: ${handle.workflowId}`);
        console.log(`[Client] Run ID: ${handle.firstExecutionRunId}`);

        return {
            workflowId: handle.workflowId,
            runId: handle.firstExecutionRunId
        };
    }

    /**
     * Get workflow handle (to send signals/updates later if needed)
     */
    async getWorkflowHandle(workflowId: string) {
        const connection = await Connection.connect({
            address: this.config.temporalAddress
        });

        const client = new Client({ connection });
        return client.workflow.getHandle(workflowId);
    }
}

/**
 * Example usage:
 * 
 * const client = new WorkflowClient();
 * const { workflowId } = await client.startWorkflow('CASE-001');
 * 
 * // Now external apps can:
 * // - Query the work item: GET /api/workitems?contextData.caseId=CASE-001
 * // - Claim it: POST /api/workitems/{id}/claim
 * // - Complete it: POST /api/workitems/{id}/complete
 */
