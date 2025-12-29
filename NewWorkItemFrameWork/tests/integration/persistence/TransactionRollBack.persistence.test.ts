import { unitOfWork, pool } from './testDb';
import { JdbcWorkItemRepository } from '../../../packages/persistence/repository/JdbcWorkItemRepository';
import { JdbcWorkItemAuditRepository } from '../../../packages/persistence/repository/JdbcWorkItemAuditRepository';

describe('Transaction rollback', () => {

  it('rolls back work_item if audit insert fails', async () => {
    const uow = unitOfWork();
    const logger = console; // Replace with an appropriate Logger instance if available
    const repo = new JdbcWorkItemRepository(logger);
    const auditRepo = new JdbcWorkItemAuditRepository();

    await expect(
      uow.withTransaction(async tx => {
        const id = await repo.insert(tx, {
          workflowId: 'WF2',
          state: 'ACTIVE',
          runId: 'run-2'
        });

        // violate NOT NULL or FK intentionally
        await auditRepo.insert(tx, {
            workItemId: id,
            action: null as any,
            toState: '',
            actorId: ''
        });
      })
    ).rejects.toBeDefined();

    const rows = await pool.query(
      `select * from work_items where workflow_id='WF2'`
    );
    expect(rows.rowCount).toBe(0);
  });
});
