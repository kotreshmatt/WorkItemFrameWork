import * as grpc from '@grpc/grpc-js';
import { EventEmitter } from 'events';
interface Config {
    address: string;
    credentials?: grpc.ChannelCredentials;
}
export declare class WorkItemClient extends EventEmitter {
    private config;
    private client;
    private protoPackage;
    constructor(config: Config);
    /**
     * Create a new WorkItem
     */
    createWorkItem(params: {
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
    }): Promise<{
        accepted: boolean;
        workItemId: number;
        error?: string;
    }>;
    /**
     * Claim a WorkItem
     */
    claimWorkItem(params: {
        workItemId: number;
        actorId: string;
        idempotencyKey?: string;
    }): Promise<{
        accepted: boolean;
        workItemId?: number;
        state: string;
        error?: string;
    }>;
    /**
     * Complete a WorkItem
     */
    completeWorkItem(params: {
        workItemId: number;
        output: Record<string, any>;
        actorId: string;
        idempotencyKey?: string;
    }): Promise<{
        accepted: boolean;
        state: string;
        error?: string;
    }>;
    /**
     * Cancel a WorkItem
     */
    cancelWorkItem(params: {
        workItemId: number;
        reason: string;
        actorId: string;
        idempotencyKey?: string;
    }): Promise<{
        accepted: boolean;
        state: string;
        error?: string;
    }>;
    private invokeRpc;
}
export {};
//# sourceMappingURL=WorkItemClient.d.ts.map