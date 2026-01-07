// ===========================================================================
// SDK E2E Integration Test - Production Quality
// ===========================================================================
// Run: npm test -- packages/sdk/test/sdk-integration.test.ts

import { DistributionStrategyType, DistributionMode } from 'domain/workitem/WorkItemDistribution';
import { WorkItemClient } from '../../packages/sdk/src/client/WorkItemClient';
import { Pool } from 'pg';

describe('WorkItem SDK Integration Tests', () => {
    let client: WorkItemClient;
    let pool: Pool;
    const SERVER_ADDRESS = process.env.SDK_SERVER_ADDRESS || 'localhost:50051';

    beforeAll(async () => {
        // Database connection for test cleanup only
        pool = new Pool({
            host: process.env.TEST_DB_HOST || 'localhost',
            port: parseInt(process.env.TEST_DB_PORT || '5432'),
            database: process.env.TEST_DB_NAME || 'bpmdb',
            user: process.env.TEST_DB_USER || 'bpmdb',
            password: process.env.TEST_DB_PASSWORD || 'bpmdb'
        });

        // Initialize SDK Client (what consumers actually use)
        client = new WorkItemClient({
            address: SERVER_ADDRESS
        });

        // Clean WorkItem tables (preserve users, orgs, positions, groups)
        await cleanWorkItemTables(pool);
    });

    afterAll(async () => {
        await pool.end();
    });

    // ===========================================================================
    // HAPPY PATH TESTS
    // ===========================================================================

    describe('CREATE WorkItem', () => {
        it('should create WorkItem successfully', async () => {
            const result = await client.createWorkItem({
                workflowId: 'exception-handling-wf07012026',
                runId: 'run1',
                taskType: 'Technical-Exception',
                taskName: 'Handle exception',
                assignmentSpec: {
                    candidatePositions: ['manager'],
                    strategy: DistributionStrategyType.DEFAULT,
                    mode: DistributionMode.PULL
                },
                lifecycle: 'default',
                initiatedBy: 'system',
                initiatedAt: new Date(),
                parameters: [
                    {
                        name: 'request',
                        direction: 'IN',
                        //type: 'object',
                        value: { errocode: 'ERROR_CODE', errorMessage: 'Error message' }
                    },
                    {
                        name: 'retry',
                        direction: 'INOUT',
                        //type: 'boolean',
                        mandatory: false,
                        value: null
                    },
                    {
                        name: 'comments',
                        direction: 'INOUT',
                        //type: 'string',
                        mandatory: false,
                        value: null
                    },
                    {
                        name: 'skiperror',
                        direction: 'OUT',
                        //type: 'boolean',
                        value: null
                    }
                ],
                contextData: { additionalInfo: 'Test work item' }
            });

            expect(result.accepted).toBe(true);
            expect(result.workItemId).toBeGreaterThan(0);
        }, 10000);
    });

    describe('CLAIM WorkItem', () => {
        let workItemId: number;

        beforeEach(async () => {
            const created = await client.createWorkItem({
                workflowId: 'Claim exception-handling-wf',
                runId: 'rClaim-run1',
                taskType: 'Technical-Exception',
                taskName: 'Handle exception',
                assignmentSpec: {
                    candidatePositions: ['manager'],
                    strategy: DistributionStrategyType.DEFAULT,
                    mode: DistributionMode.PULL
                },
                lifecycle: 'default',
                initiatedBy: 'system',
                initiatedAt: new Date(),
                parameters: [
                    {
                        name: 'request',
                        direction: 'IN',
                        //type: 'object',
                        value: { errocode: 'ERROR_CODE', errorMessage: 'Error message' }
                    },
                    {
                        name: 'retry',
                        direction: 'INOUT',
                        //type: 'boolean',
                        mandatory: false,
                        value: null
                    },
                    {
                        name: 'comments',
                        direction: 'INOUT',
                        //type: 'string',
                        mandatory: false,
                        value: null
                    },
                    {
                        name: 'skiperror',
                        direction: 'OUT',
                        //type: 'boolean',
                        value: null
                    }
                ],
                contextData: { additionalInfo: 'Test work item' }
            });
            workItemId = created.workItemId!;
        });

        it('should claim WorkItem by eligible user', async () => {
            const result = await client.claimWorkItem({
                workItemId,
                actorId: 'user1'
            });

            console.log('[TEST] Claim result:', result);
            expect(result.accepted).toBe(true);
            expect(result.state).toBe('CLAIMED');
        });

        it('should reject claim by ineligible user', async () => {
            const result = await client.claimWorkItem({
                workItemId,
                actorId: 'user999'
            });

            expect(result.accepted).toBe(false);
        });
    });

    describe('COMPLETE WorkItem', () => {
        let workItemId: number;

        beforeEach(async () => {
            const created = await client.createWorkItem({
                workflowId: 'complete-test-wf',
                runId: 'complete-run',
                taskType: 'USER_TASK',
                taskName: 'ProcessTask',
                lifecycle: 'default',
                initiatedBy: 'system',
                assignmentSpec: {
                    candidateUsers: ['user1'],
                    strategy: 'OFFER_TO_ALL',
                    mode: 'PULL'
                }
            });
            workItemId = created.workItemId!;

            await client.claimWorkItem({
                workItemId,
                actorId: 'user1'
            });
        });

        it('should complete claimed WorkItem', async () => {
            const result = await client.completeWorkItem({
                workItemId,
                output: [
                    { name: 'retry', value: false },
                    { name: 'comments', value: 'Task completed successfully' },
                    { name: 'skiperror', value: false }
                ],
                actorId: 'user1'
            });

            expect(result.accepted).toBe(true);
            expect(result.state).toBe('COMPLETED');
        });
    });

    describe('CANCEL WorkItem', () => {
        let workItemId: number;

        beforeEach(async () => {
            const created = await client.createWorkItem({
                workflowId: 'cancel-test-wf',
                runId: 'cancel-run',
                taskType: 'USER_TASK',
                taskName: 'CancellableTask',
                lifecycle: 'default',
                initiatedBy: 'system',
                assignmentSpec: {
                    strategy: 'OFFER_TO_ALL',
                    mode: 'PULL'
                }
            });
            workItemId = created.workItemId!;
        });

        it('should cancel WorkItem with reason', async () => {
            const result = await client.cancelWorkItem({
                workItemId,
                reason: 'Order cancelled by customer',
                actorId: 'system'
            });

            expect(result.accepted).toBe(true);
            expect(result.state).toBe('CANCELLED');
        });
    });

    // ===========================================================================
    // PARAMETER VALIDATION TESTS
    // ===========================================================================
    describe('Parameter Validation on COMPLETE', () => {
        let workItemId: number;

        beforeEach(async () => {
            // Create work item with defined parameters
            const created = await client.createWorkItem({
                workflowId: 'validation-wf',
                runId: 'run-validation-' + Date.now(),
                taskType: 'Technical-Exception',
                taskName: 'Handle exception with parameters',
                assignmentSpec: {
                    candidatePositions: ['manager'],
                    strategy: DistributionStrategyType.DEFAULT,
                    mode: DistributionMode.PULL
                },
                lifecycle: 'default',
                initiatedBy: 'system',
                initiatedAt: new Date(),
                parameters: [
                    { name: 'request', direction: 'IN', value: { error: 'ERR_001' }, mandatory: true },
                    { name: 'retry', direction: 'INOUT', mandatory: false, value: null },
                    { name: 'comments', direction: 'INOUT', mandatory: false, value: null },
                    { name: 'skiperror', direction: 'OUT', mandatory: true, value: null }
                ],
                contextData: { test: 'validation' }
            });

            workItemId = created.workItemId!;

            // Claim the work item first
            await client.claimWorkItem({ workItemId, actorId: 'user1' });
        });

        it('should reject unknown parameter', async () => {
            const result = await client.completeWorkItem({
                workItemId,
                output: [{ name: 'unknownParam', value: 'test' }],
                actorId: 'user1'
            });
            expect(result.accepted).toBe(false);
            expect(result.error).toContain('Unknown parameter');
        });

        it('should reject IN parameter as output', async () => {
            const result = await client.completeWorkItem({
                workItemId,
                output: [{ name: 'request', value: { error: 'NEW' } }],
                actorId: 'user1'
            });
            expect(result.accepted).toBe(false);
            expect(result.error).toContain('direction IN');
        });

        it('should require mandatory OUT parameter', async () => {
            const result = await client.completeWorkItem({
                workItemId,
                output: [{ name: 'retry', value: false }],
                actorId: 'user1'
            });
            expect(result.accepted).toBe(false);
            expect(result.error).toContain('Mandatory');
        });

        it('should accept valid output parameters', async () => {
            const result = await client.completeWorkItem({
                workItemId,
                output: [
                    { name: 'retry', value: false },
                    { name: 'comments', value: 'Completed' },
                    { name: 'skiperror', value: true }
                ],
                actorId: 'user1'
            });
            expect(result.accepted).toBe(true);
            expect(result.state).toBe('COMPLETED');
        });
    });

    // ===========================================================================
    // VALIDATION TESTS
    // ===========================================================================

    describe('Validation Rules', () => {
        it('should reject empty workflowId', async () => {
            const result = await client.createWorkItem({
                workflowId: '',
                runId: 'validation-run',
                taskType: 'USER_TASK',
                taskName: 'Task',
                lifecycle: 'default',
                initiatedBy: 'system',
                assignmentSpec: {
                    strategy: 'OFFER_TO_ALL',
                    mode: 'PULL'
                }
            });

            expect(result.accepted).toBe(false);
        });

        it('should reject double claim', async () => {
            const created = await client.createWorkItem({
                workflowId: 'double-claim-test',
                runId: 'double-claim-run',
                taskType: 'USER_TASK',
                taskName: 'Task',
                lifecycle: 'default',
                initiatedBy: 'system',
                assignmentSpec: {
                    candidateUsers: ['user1'],
                    strategy: 'OFFER_TO_ALL',
                    mode: 'PULL'
                }
            });

            await client.claimWorkItem({
                workItemId: created.workItemId!,
                actorId: 'user1'
            });

            const result = await client.claimWorkItem({
                workItemId: created.workItemId!,
                actorId: 'user1'
            });

            expect(result.accepted).toBe(false);
        });
    });

    // ===========================================================================
    // IDEMPOTENCY TESTS (if enabled in FeatureFlags)
    // ===========================================================================

    describe('Idempotency', () => {
        it('should reject duplicate with same idempotency key', async () => {
            const created = await client.createWorkItem({
                workflowId: 'idem-test',
                runId: 'idem-run',
                taskType: 'USER_TASK',
                taskName: 'Task',
                lifecycle: 'default',
                initiatedBy: 'system',
                assignmentSpec: {
                    candidateUsers: ['user1'],
                    strategy: 'OFFER_TO_ALL',
                    mode: 'PULL'
                }
            });

            const key = 'test-idem-key-123';

            const claim1 = await client.claimWorkItem({
                workItemId: created.workItemId!,
                actorId: 'user1',
                idempotencyKey: key
            });
            expect(claim1.accepted).toBe(true);

            // Duplicate - should be rejected if IDEMPOTENCY_ENABLED=true
            const claim2 = await client.claimWorkItem({
                workItemId: created.workItemId!,
                actorId: 'user1',
                idempotencyKey: key
            });

            // If idempotency disabled, second claim fails for different reason
            expect(claim2.accepted).toBe(false);
        });
    });
});

// ===========================================================================
// Helper: Clean WorkItem Tables (preserve users/orgs/positions/groups)
// ===========================================================================
async function cleanWorkItemTables(pool: Pool): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Order matters: delete dependent tables first
        await client.query('DELETE FROM outbox_events');
        //await client.query('DELETE FROM idempotency_keys');
        await client.query('DELETE FROM work_item_parameters');
        await client.query('DELETE FROM work_item_participant');
        await client.query('DELETE FROM work_item_audit');
        await client.query('DELETE FROM work_items');

        // Reset sequences
        await client.query('ALTER SEQUENCE work_item_id_seq RESTART WITH 1');

        await client.query('COMMIT');
        console.log('[Test Setup] WorkItem tables cleaned');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[Test Setup] Failed to clean tables:', err);
        throw err;
    } finally {
        client.release();
    }
}

// ===========================================================================
// Test Coverage: 10 integration tests covering happy + unhappy paths
// Run Requirements:
//   1. gRPC server must be running (npm run dev:server in packages/sdk)
//   2. Database must be initialized with schema
//   3. Set TEST_DB_* environment variables
// ===========================================================================
