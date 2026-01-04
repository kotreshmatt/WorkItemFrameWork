import { unitOfWork, pool } from './testDb';
import { JdbcWorkItemRepository } from '../../../packages/persistence/repository/JdbcWorkItemRepository';
import { JdbcWorkItemAuditRepository } from '../../../packages/persistence/repository/JdbcWorkItemAuditRepository';
import { JdbcOutboxRepository } from '../../../packages/persistence/repository/JdbcOutboxRepository';

describe('Create WorkItem transaction', () => {

  it('creates work_item, audit and outbox atomically', async () => {
    const uow = unitOfWork();

    const logger = console; // Replace with an appropriate Logger instance if available
    const workItemRepo = new JdbcWorkItemRepository(logger);
    const auditRepo = new JdbcWorkItemAuditRepository();
    const outboxRepo = new JdbcOutboxRepository();

    let workItemId!: number;

    await uow.withTransaction(async tx => {
      workItemId = await workItemRepo.insert(tx, {
        workflowId: 'WF1',
        state: 'ACTIVE',
        runId: 'run-1'
      });

      await auditRepo.insert(tx, {
        workItemId,
        action: 'CREATE',
        toState: 'ACTIVE',
        actorId: 'system'
      });

      await outboxRepo.insert(tx, {
        aggregateId: workItemId,
        aggregateType: 'WorkItem',
        eventType: 'WorkItemCreated',
        eventVersion: '1',
        payload: JSON.stringify({}),
        occurredAt: new Date()
      });
    });

    const wi = await pool.query(
      'select * from work_items where id=$1',
      [workItemId]
    );
    const audit = await pool.query(
      'select * from work_item_audit where work_item_id=$1',
      [workItemId]
    );
    const outbox = await pool.query(
      'select * from outbox_events where aggregate_id=$1',
      [workItemId]
    );

    expect(wi.rowCount).toBe(1);
    expect(audit.rowCount).toBe(1);
    expect(outbox.rowCount).toBe(1);
  });
});
