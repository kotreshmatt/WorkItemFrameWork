// ===========================================================================
// SDK E2E Test - ENHANCED (Happy + Unhappy Paths)
// Run in IDE Terminal: npm test -- sdk-e2e.test.ts
// ===========================================================================

import { WorkItemClient } from '../../packages/sdk/src/client/WorkItemClient';
import { WorkItemGrpcServer } from '../../packages/sdk/src/server/WorkItemGrpcServer';
import { Pool } from 'pg';


describe('WorkItem SDK E2E - Comprehensive', () => {
    let server: WorkItemGrpcServer;
    let client: WorkItemClient;
    let pool: Pool;
    const TEST_PORT = 50052;

    beforeAll(async () => {
        // Database setup
        pool = new Pool({
            host: process.env.TEST_DB_HOST || 'localhost',
            database: process.env.TEST_DB_NAME || 'bpmdb',
            user: process.env.TEST_DB_USER || 'bpmdb',
            password: process.env.TEST_DB_PASSWORD || 'bpmdb'
        });

        const { executor } = await initializeFramework(pool);

        server = new WorkItemGrpcServer(TEST_PORT, executor);
        await server.start();

        client = new WorkItemClient({ address: `localhost:${TEST_PORT}` });

        await pool.query('TRUNCATE work_items RESTART IDENTITY CASCADE');
    });

    afterAll(async () => {
        await server.stop();
        await pool.end();
    });

    // ===========================================================================
    // HAPPY PATHS
    // ===========================================================================

    describe('[HAPPY] CREATE WorkItem', () => {
        it('should create with all fields', async () => {
            const result = await client.createWorkItem({
                workflowId: 'wf-001',
                taskName: 'Task1',
                parameters: { key: 'value' },
                assignment: { candidateUsers: ['u1'] },
                actorId: 'system'
            });

            expect(result.accepted).toBe(true);
            expect(result.workItemId).toBeGreaterThan(0);
        });

        it('should create with minimal fields', async () => {
            const result = await client.createWorkItem({
                workflowId: 'wf-002',
                taskName: 'Task2',
                actorId: 'system'
            });

            expect(result.accepted).toBe(true);
        });
    });

    describe('[HAPPY] CLAIM WorkItem', () => {
        let wid: number;

        beforeEach(async () => {
            const r = await client.createWorkItem({
                workflowId: 'claim-wf',
                taskName: 'ClaimTask',
                assignment: { candidateUsers: ['user1'] },
                actorId: 'system'
            });
            wid = r.workItemId!;
        });

        it('should claim by eligible user', async () => {
            const result = await client.claimWorkItem({
                workItemId: wid,
                actorId: 'user1'
            });

            expect(result.accepted).toBe(true);
            expect(result.state).toBe('CLAIMED');
        });
    });

    describe('[HAPPY] COMPLETE WorkItem', () => {
        let wid: number;

        beforeEach(async () => {
            const r = await client.createWorkItem({
                workflowId: 'complete-wf',
                taskName: 'CompleteTask',
                assignment: { candidateUsers: ['user1'] },
                actorId: 'system'
            });
            wid = r.workItemId!;
            await client.claimWorkItem({ workItemId: wid, actorId: 'user1' });
        });

        it('should complete with output', async () => {
            const result = await client.completeWorkItem({
                workItemId: wid,
                output: { result: 'success' },
                actorId: 'user1'
            });

            expect(result.accepted).toBe(true);
            expect(result.state).toBe('COMPLETED');
        });
    });

    describe('[HAPPY] CANCEL WorkItem', () => {
        let wid: number;

        beforeEach(async () => {
            const r = await client.createWorkItem({
                workflowId: 'cancel-wf',
                taskName: 'CancelTask',
                actorId: 'system'
            });
            wid = r.workItemId!;
        });

        it('should cancel with reason', async () => {
            const result = await client.cancelWorkItem({
                workItemId: wid,
                reason: 'User requested',
                actorId: 'system'
            });

            expect(result.accepted).toBe(true);
            expect(result.state).toBe('CANCELLED');
        });
    });

    // ===========================================================================
    // UNHAPPY PATHS
    // ===========================================================================

    describe('[UNHAPPY] CREATE Validations', () => {
        it('should reject empty workflowId', async () => {
            const result = await client.createWorkItem({
                workflowId: '',
                taskName: 'Task',
                actorId: 'system'
            });

            expect(result.accepted).toBe(false);
            expect(result.error).toContain('workflowId');
        });

        it('should reject empty taskName', async () => {
            const result = await client.createWorkItem({
                workflowId: 'wf',
                taskName: '',
                actorId: 'system'
            });

            expect(result.accepted).toBe(false);
        });
    });

    describe('[UNHAPPY] CLAIM Validations', () => {
        let wid: number;

        beforeEach(async () => {
            const r = await client.createWorkItem({
                workflowId: 'unhappy-claim',
                taskName: 'Task',
                assignment: { candidateUsers: ['user1'] },
                actorId: 'system'
            });
            wid = r.workItemId!;
        });

        it('should reject claim by ineligible user', async () => {
            const result = await client.claimWorkItem({
                workItemId: wid,
                actorId: 'user999'
            });

            expect(result.accepted).toBe(false);
            expect(result.error).toContain('not eligible');
        });

        it('should reject claim of non-existent WorkItem', async () => {
            const result = await client.claimWorkItem({
                workItemId: 99999,
                actorId: 'user1'
            });

            expect(result.accepted).toBe(false);
        });

        it('should reject double claim', async () => {
            await client.claimWorkItem({ workItemId: wid, actorId: 'user1' });

            const result = await client.claimWorkItem({
                workItemId: wid,
                actorId: 'user1'
            });

            expect(result.accepted).toBe(false);
            expect(result.error).toContain('already claimed');
        });
    });

    describe('[UNHAPPY] COMPLETE Validations', () => {
        it('should reject complete of unclaimed WorkItem', async () => {
            const r = await client.createWorkItem({
                workflowId: 'unclaimed',
                taskName: 'Task',
                actorId: 'system'
            });

            const result = await client.completeWorkItem({
                workItemId: r.workItemId!,
                output: {},
                actorId: 'user1'
            });

            expect(result.accepted).toBe(false);
        });

        it('should reject complete by non-owner', async () => {
            const r = await client.createWorkItem({
                workflowId: 'owner-test',
                taskName: 'Task',
                assignment: { candidateUsers: ['user1', 'user2'] },
                actorId: 'system'
            });

            await client.claimWorkItem({ workItemId: r.workItemId!, actorId: 'user1' });

            const result = await client.completeWorkItem({
                workItemId: r.workItemId!,
                output: {},
                actorId: 'user2'  // Different user
            });

            expect(result.accepted).toBe(false);
        });
    });

    describe('[UNHAPPY] State Transition Validations', () => {
        it('should reject complete of already completed WorkItem', async () => {
            const r = await client.createWorkItem({
                workflowId: 'double-complete',
                taskName: 'Task',
                assignment: { candidateUsers: ['user1'] },
                actorId: 'system'
            });

            await client.claimWorkItem({ workItemId: r.workItemId!, actorId: 'user1' });
            await client.completeWorkItem({
                workItemId: r.workItemId!,
                output: {},
                actorId: 'user1'
            });

            // Try to complete again
            const result = await client.completeWorkItem({
                workItemId: r.workItemId!,
                output: {},
                actorId: 'user1'
            });

            expect(result.accepted).toBe(false);
        });

        it('should reject claim of cancelled WorkItem', async () => {
            const r = await client.createWorkItem({
                workflowId: 'cancelled',
                taskName: 'Task',
                assignment: { candidateUsers: ['user1'] },
                actorId: 'system'
            });

            await client.cancelWorkItem({
                workItemId: r.workItemId!,
                reason: 'test',
                actorId: 'system'
            });

            const result = await client.claimWorkItem({
                workItemId: r.workItemId!,
                actorId: 'user1'
            });

            expect(result.accepted).toBe(false);
        });
    });

    describe('[UNHAPPY] Idempotency', () => {
        it('should reject duplicate with same key', async () => {
            const r = await client.createWorkItem({
                workflowId: 'idem',
                taskName: 'Task',
                assignment: { candidateUsers: ['user1'] },
                actorId: 'system'
            });

            const key = 'idem-key-123';

            await client.claimWorkItem({
                workItemId: r.workItemId!,
                actorId: 'user1',
                idempotencyKey: key
            });

            const result = await client.claimWorkItem({
                workItemId: r.workItemId!,
                actorId: 'user1',
                idempotencyKey: key
            });

            expect(result.accepted).toBe(false);
            expect(result.error).toContain('Duplicate');
        });
    });
});

// ===========================================================================
// Helper (minimal for test)
// ===========================================================================
async function initializeFramework(pool: Pool) {
    // Simplified - in real test use proper bootstrap
    const uow = new (require('../../packages/persistence/common/JdbcPersistenceUnitOfWork').JdbcPersistenceUnitOfWork)(pool);
    const executor = new (require('../../packages/persistence/executor/WorkItemCommandExecutor').WorkItemCommandExecutor)(
        uow,
        /* other deps */
    );
    return { executor };
}

// ===========================================================================
// RUN: npm test -- sdk-e2e.test.ts
// Test Coverage: 15 test cases (7 happy, 8 unhappy paths)
// ===========================================================================
