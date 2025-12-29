import { TransactionContext } from '../common/TransactionContext';

export class JdbcOutboxRepository {
  insert(tx: TransactionContext, arg1: { aggregateId: number; eventType: string; }) {
      throw new Error('Method not implemented.');
  }

  async write(
    tx: TransactionContext,
    aggregateId: number,
    eventType: string,
    payload: any
  ): Promise<void> {

    await tx.query(
      `INSERT INTO outbox_events
       (aggregate_id, event_type, payload)
       VALUES ($1,$2,$3)`,
      [aggregateId, eventType, payload]
    );
  }
}
