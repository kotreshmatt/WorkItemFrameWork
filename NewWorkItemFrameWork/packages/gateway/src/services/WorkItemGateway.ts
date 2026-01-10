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
        const businessKey = `${workItemId}-${userId}-${action}`;
        const idempotencyKey = `${businessKey}-${Date.now()}`;
        const requestId = uuidv4();

        // Layer 2: Business key check
        const existingRequests = await this.idempotencyService.getByBusinessKey(businessKey);

        if (existingRequests.length > 0) {
            const latest = existingRequests[0];

            if (latest.status === 'COMPLETED') {
                console.log('[GATEWAY] Rejecting duplicate - work item already claimed');

                // ✅ Safe JSON parsing - handle corrupted data
                let originalResult = null;
                try {
                    if (latest.response_payload) {
                        // Check if it's already an object (shouldn't be, but handle it)
                        if (typeof latest.response_payload === 'string') {
                            originalResult = JSON.parse(latest.response_payload);
                        } else {
                            originalResult = latest.response_payload;
                        }
                    }
                } catch (error: any) {
                    console.error('[GATEWAY] Failed to parse response_payload:', error.message);
                    console.error('[GATEWAY] Raw payload:', latest.response_payload);
                }

                return {
                    requestId: uuidv4(),
                    workItemId,
                    action,
                    status: 'DUPLICATE',
                    message: `Work item ${workItemId} has already been ${action}ED by ${userId}`,
                    originalResult
                };
            }

            if (latest.status === 'IN_PROGRESS') {
                return {
                    requestId: latest.request_id,
                    workItemId,
                    action,
                    status: 'IN_PROGRESS',
                    message: `Your request to ${action} work item ${workItemId} is still in progress.`
                };
            }
        }

        await this.idempotencyService.create({
            key: idempotencyKey,
            businessKey,
            requestId,
            status: 'IN_PROGRESS',
            request: { workItemId, userId, action, workflowId }
        });

        try {
            const result: any = await this.temporalClient.claimWithTimeout(
                workflowId,
                workItemId,
                userId,
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

            // ✅ Check if workflow accepted - mark as FAILED if rejected
            if (result?.accepted === false) {
                await this.idempotencyService.fail(idempotencyKey, response);
            } else {
                await this.idempotencyService.complete(idempotencyKey, response);
            }

            return response;
        } catch (error: any) {
            await this.idempotencyService.fail(idempotencyKey, error);

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
        const businessKey = `${workItemId}-${userId}-${action}`;
        const idempotencyKey = `${businessKey}-${Date.now()}`;  // Unique per request
        const requestId = uuidv4();

        // Layer 2: Business key check - Prevent duplicate business operations
        const existingRequests = await this.idempotencyService.getByBusinessKey(businessKey);

        if (existingRequests.length > 0) {
            const latest = existingRequests[0]; // Most recent attempt (ordered by created_at DESC)

            console.log('[GATEWAY] Found existing request for business key:', businessKey, 'status:', latest.status);

            if (latest.status === 'COMPLETED') {
                console.log('[GATEWAY] Rejecting duplicate - work item already completed');

                // ✅ Safe JSON parsing
                let originalResult = null;
                try {
                    if (latest.response_payload) {
                        if (typeof latest.response_payload === 'string') {
                            originalResult = JSON.parse(latest.response_payload);
                        } else {
                            originalResult = latest.response_payload;
                        }
                    }
                } catch (error: any) {
                    console.error('[GATEWAY] Failed to parse response_payload:', error.message);
                }

                return {
                    requestId: uuidv4(),
                    workItemId,
                    action,
                    status: 'DUPLICATE',
                    message: `Work item ${workItemId} has already been ${action}ED`,
                    originalResult
                };
            }

            if (latest.status === 'IN_PROGRESS') {
                console.log('[GATEWAY] Request still in progress, returning status');
                return {
                    requestId: latest.request_id,
                    workItemId,
                    action,
                    status: 'IN_PROGRESS',
                    message: `Your request for ${action} on work item ${workItemId} is still in progress. Please check later.`
                };
            }

            // FAILED status → Allow retry (continue with execution below)
            console.log('[GATEWAY] Previous request failed, allowing retry with new idempotency key');
        }

        // Layer 1: Create idempotency record with unique key (includes timestamp)
        await this.idempotencyService.create({
            key: idempotencyKey,
            businessKey,
            requestId,
            status: 'IN_PROGRESS',
            request: { workItemId, userId, action, workflowId, output }
        });

        try {
            // DEBUG: Log what we're sending to Temporal
            console.log('[GATEWAY-DEBUG] Calling Temporal with output:', JSON.stringify(output, null, 2));
            console.log('[GATEWAY-DEBUG] Output array length:', output.length);

            const result: any = await this.temporalClient.completeWithTimeout(
                workflowId,
                workItemId,
                userId,
                output,
                idempotencyKey,  // Unique key with timestamp → Temporal won't cache
                timeoutMs
            );

            const response = {
                requestId,
                workItemId,
                action,
                status: result?.accepted ? 'ACCEPTED' : 'REJECTED',
                result
            };

            // ✅ FIX: Check if SDK/workflow accepted - mark as FAILED if rejected
            if (result?.accepted === false) {
                console.log('[GATEWAY] Request rejected by workflow/SDK - marking as FAILED', {
                    workItemId,
                    error: result.error,
                    state: result.state
                });
                await this.idempotencyService.fail(idempotencyKey, response);
            } else {
                await this.idempotencyService.complete(idempotencyKey, response);
            }

            return response;
        } catch (error: any) {
            // Mark as failed to allow retries
            await this.idempotencyService.fail(idempotencyKey, error);

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
        const businessKey = `${workItemId}-${userId}-${action}`;
        const idempotencyKey = `${businessKey}-${Date.now()}`;
        const requestId = uuidv4();

        // Layer 2: Business key check
        const existingRequests = await this.idempotencyService.getByBusinessKey(businessKey);

        if (existingRequests.length > 0) {
            const latest = existingRequests[0];

            if (latest.status === 'COMPLETED') {
                // ✅ Safe JSON parsing
                let originalResult = null;
                try {
                    if (latest.response_payload) {
                        if (typeof latest.response_payload === 'string') {
                            originalResult = JSON.parse(latest.response_payload);
                        } else {
                            originalResult = latest.response_payload;
                        }
                    }
                } catch (error: any) {
                    console.error('[GATEWAY] Failed to parse response_payload:', error.message);
                }

                return {
                    requestId: uuidv4(),
                    workItemId,
                    action,
                    status: 'DUPLICATE',
                    message: `Work item ${workItemId} has already been ${action}ED`,
                    originalResult
                };
            }

            if (latest.status === 'IN_PROGRESS') {
                return {
                    requestId: latest.request_id,
                    workItemId,
                    action,
                    status: 'IN_PROGRESS',
                    message: `Your request to ${action} work item ${workItemId} is still in progress.`
                };
            }
        }

        await this.idempotencyService.create({
            key: idempotencyKey,
            businessKey,
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

            // ✅ Check if workflow accepted - mark as FAILED if rejected
            if (result?.accepted === false) {
                await this.idempotencyService.fail(idempotencyKey, response);
            } else {
                await this.idempotencyService.complete(idempotencyKey, response);
            }

            return response;
        } catch (error: any) {
            await this.idempotencyService.fail(idempotencyKey, error);

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
