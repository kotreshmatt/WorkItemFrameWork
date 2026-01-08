import { IdempotencyService } from './IdempotencyService';
import { TemporalClient, TimeoutError } from './TemporalClient';
import { WorkItemQueryService } from './WorkItemQueryService';
import { v4 as uuidv4 } from 'uuid';

export class WorkItemGateway {
    private idempotencyService = new IdempotencyService();
    private temporalClient = new TemporalClient();
    private queryService = new WorkItemQueryService();

    async claim(workItemId: number, userId: string, workflowId: string, timeoutMs?: number) {
        const action = 'CLAIM';
        const idempotencyKey = `${workItemId}-${userId}-${action}`;
        const requestId = uuidv4();

        // Check idempotency
        const cached = await this.idempotencyService.get(idempotencyKey);
        if (cached) {
            return JSON.parse(cached.response_payload);
        }

        // Insert idempotency record
        await this.idempotencyService.create({
            key: idempotencyKey,
            requestId,
            status: 'IN_PROGRESS',
            request: { workItemId, userId, action, workflowId }
        });

        try {
            // Call Temporal
            const result: any = await this.temporalClient.claimWithTimeout(
                workflowId,
                workItemId,
                userId,
                idempotencyKey,
                timeoutMs
            );

            // Update idempotency record
            const response = {
                requestId,
                workItemId,
                action,
                status: result?.accepted ? 'ACCEPTED' : 'REJECTED',
                result
            };

            await this.idempotencyService.complete(idempotencyKey, response);

            return response;
        } catch (error: any) {
            if (error instanceof TimeoutError || error.name === 'TimeoutError') {
                return {
                    requestId,
                    workItemId,
                    action,
                    status: 'IN_PROGRESS',
                    message: `Your request for ${action} workitem ${workItemId} is in progress. Please check later.`
                };
            }
            throw error;
        }
    }

    async complete(workItemId: number, userId: string, workflowId: string, output: any[], timeoutMs?: number) {
        const action = 'COMPLETE';
        const idempotencyKey = `${workItemId}-${userId}-${action}`;
        const requestId = uuidv4();

        const cached = await this.idempotencyService.get(idempotencyKey);
        if (cached) {
            return JSON.parse(cached.response_payload);
        }

        await this.idempotencyService.create({
            key: idempotencyKey,
            requestId,
            status: 'IN_PROGRESS',
            request: { workItemId, userId, action, workflowId, output }
        });

        try {
            const result: any = await this.temporalClient.completeWithTimeout(
                workflowId,
                workItemId,
                userId,
                output,
                idempotencyKey,
                timeoutMs
            );

            const response = {
                requestId,
                workItemId,
                action,
                status: result?.accepted ? 'ACCEPTED' : 'REJECTED',
                result
            };

            await this.idempotencyService.complete(idempotencyKey, response);

            return response;
        } catch (error: any) {
            if (error instanceof TimeoutError || error.name === 'TimeoutError') {
                return {
                    requestId,
                    workItemId,
                    action,
                    status: 'IN_PROGRESS',
                    message: `Your request for ${action} workitem ${workItemId} is in progress. Please check later.`
                };
            }
            throw error;
        }
    }

    async cancel(workItemId: number, userId: string, workflowId: string, reason: string, timeoutMs?: number) {
        const action = 'CANCEL';
        const idempotencyKey = `${workItemId}-${userId}-${action}`;
        const requestId = uuidv4();

        const cached = await this.idempotencyService.get(idempotencyKey);
        if (cached) {
            return JSON.parse(cached.response_payload);
        }

        await this.idempotencyService.create({
            key: idempotencyKey,
            requestId,
            status: 'IN_PROGRESS',
            request: { workItemId, userId, action, workflowId, reason }
        });

        try {
            const result: any = await this.temporalClient.cancelWithTimeout(
                workflowId,
                workItemId,
                userId,
                reason,
                idempotencyKey,
                timeoutMs
            );

            const response = {
                requestId,
                workItemId,
                action,
                status: result?.accepted ? 'ACCEPTED' : 'REJECTED',
                result
            };

            await this.idempotencyService.complete(idempotencyKey, response);

            return response;
        } catch (error: any) {
            if (error instanceof TimeoutError || error.name === 'TimeoutError') {
                return {
                    requestId,
                    workItemId,
                    action,
                    status: 'IN_PROGRESS',
                    message: `Your request for ${action} workitem ${workItemId} is in progress. Please check later.`
                };
            }
            throw error;
        }
    }

    // Query methods (direct DB access, no Temporal)
    async getWorkItem(workItemId: number) {
        return await this.queryService.findById(workItemId);
    }

    async getWorkItemsByUser(userId: string) {
        return await this.queryService.findByUser(userId);
    }

    async getWorkItemsByState(state: string) {
        return await this.queryService.findByState(state);
    }

    async getAllWorkItems(filters?: {
        state?: string;
        userId?: string;
        contextData?: Record<string, any>;
        limit?: number;
        offset?: number;
    }) {
        return await this.queryService.findAll(filters);
    }
}
