import { unitOfWork, pool } from './testDb';
import { JdbcOutboxRepository } from '../../../packages/persistence/repository/JdbcOutboxRepository';


describe('Outbox pattern (Phase 4)', () => {

  it('writes unpublished outbox event without payload', async () => {
    const uow = unitOfWork();
    const repo = new JdbcOutboxRepository();

    await uow.withTransaction(async tx => {
      await repo.insert(tx, {
        aggregateId: 99,
        eventType: 'WorkItemClaimed'
      });
    });

    const rows = await pool.query(
      `select * from outbox_events where aggregate_id = $1`,
      [99]
    );

    expect(rows.rowCount).toBe(1);
    expect(rows.rows[0].event_type).toBe('WorkItemClaimed');
    expect(rows.rows[0].published).toBe(false);
  });
});
