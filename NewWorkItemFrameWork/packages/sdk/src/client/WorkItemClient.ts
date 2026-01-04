import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { EventEmitter } from 'events';
import * as path from 'path';

// In a real build, these would be generated types.
// Mocking generic types for illustration of the Client Logic.
interface Config {
    address: string; // e.g., 'localhost:50051'
    credentials?: grpc.ChannelCredentials;
}

export class WorkItemClient extends EventEmitter {
    private client: grpc.Client;
    private protoPackage: any;

    constructor(private config: Config) {
        super();

        // Load Proto
        const protoPath = path.resolve(__dirname, '../../protos/workitem.proto');
        const packageDefinition = protoLoader.loadSync(
            protoPath,
            { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true }
        );
        const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
        this.protoPackage = protoDescriptor.workitem.v1;

        // Create Generic Client
        const Service = this.protoPackage.WorkItemService;
        this.client = new Service(
            config.address,
            config.credentials || grpc.credentials.createInsecure()
        );
    }

    // ------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------

    /**
     * Create a new WorkItem
     */
    async createWorkItem(params: {
        workflowId: string;
        runId: string;
        taskType: string;
        taskName: string;
        description?: string;
        priority?: number;
        assignmentSpec: {
            candidateUsers?: string[];
            candidateGroups?: string[];
            candidatePositions?: string[];
            candidateOrgUnits?: string[];
            strategy: string;
            mode: 'PUSH' | 'PULL';
            separationOfDutiesKey?: string;
        };
        lifecycle: string;
        initiatedBy: string;
        initiatedAt?: Date;
        parameters?: Array<{
            name: string;
            direction: 'IN' | 'OUT' | 'INOUT';
            mandatory?: boolean;
            value?: any;
        }>;
        contextData?: Record<string, unknown>;
        dueDate?: Date | null;
        distributionStrategy?: string;
        distributionMode?: 'PUSH' | 'PULL';
        actorId?: string;
        idempotencyKey?: string;
    }): Promise<{ accepted: boolean; workItemId: number; error?: string }> {

        const request = {
            workflow_id: params.workflowId,
            run_id: params.runId,
            task_type: params.taskType,
            task_name: params.taskName,
            description: params.description,
            priority: params.priority,
            assignment_spec: {
                candidate_users: params.assignmentSpec.candidateUsers || [],
                candidate_groups: params.assignmentSpec.candidateGroups || [],
                candidate_positions: params.assignmentSpec.candidatePositions || [],
                candidate_org_units: params.assignmentSpec.candidateOrgUnits || [],
                strategy: params.assignmentSpec.strategy,
                mode: params.assignmentSpec.mode,
                separation_of_duties_key: params.assignmentSpec.separationOfDutiesKey
            },
            lifecycle: params.lifecycle,
            initiated_by: params.initiatedBy,
            initiated_at: (params.initiatedAt || new Date()).toISOString(),
            parameters: params.parameters || [],
            context_data: params.contextData ? JSON.stringify(params.contextData) : undefined,
            due_date: params.dueDate?.toISOString(),
            distribution_strategy: params.distributionStrategy || params.assignmentSpec.strategy,
            distribution_mode: params.distributionMode || params.assignmentSpec.mode,
            context: {
                actor_id: params.actorId || params.initiatedBy,
                idempotency_key: params.idempotencyKey
            }
        };

        return this.invokeRpc('CreateWorkItem', request);
    }

    /**
     * Claim a WorkItem
     */
    async claimWorkItem(params: {
        workItemId: number;
        actorId: string;
        idempotencyKey?: string;
    }): Promise<{ accepted: boolean; state: string; error?: string }> {

        const request = {
            work_item_id: params.workItemId,
            context: {
                actor_id: params.actorId,
                idempotency_key: params.idempotencyKey
            }
        };

        return this.invokeRpc('ClaimWorkItem', request);
    }

    /**
     * Complete a WorkItem
     */
    async completeWorkItem(params: {
        workItemId: number;
        output: Record<string, any>;
        actorId: string;
        idempotencyKey?: string;
    }): Promise<{ accepted: boolean; state: string; error?: string }> {

        const request = {
            work_item_id: params.workItemId,
            output_json: JSON.stringify(params.output),
            context: {
                actor_id: params.actorId,
                idempotency_key: params.idempotencyKey
            }
        };

        return this.invokeRpc('CompleteWorkItem', request);
    }

    /**
     * Cancel a WorkItem
     */
    async cancelWorkItem(params: {
        workItemId: number;
        reason: string;
        actorId: string;
        idempotencyKey?: string;
    }): Promise<{ accepted: boolean; state: string; error?: string }> {

        const request = {
            work_item_id: params.workItemId,
            reason: params.reason,
            context: {
                actor_id: params.actorId,
                idempotency_key: params.idempotencyKey
            }
        };

        return this.invokeRpc('CancelWorkItem', request);
    }

    // ------------------------------------------------------------
    // Helper
    // ------------------------------------------------------------
    private invokeRpc(method: string, request: any): Promise<any> {
        return new Promise((resolve, reject) => {
            (this.client as any)[method](request, (err: Error, response: any) => {
                if (err) {
                    return reject(err);
                }
                resolve({
                    accepted: response.accepted,
                    workItemId: response.work_item_id,
                    state: response.state,
                    error: response.message
                });
            });
        });
    }
}
