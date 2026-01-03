import { TransactionContext } from '../common/TransactionContext';

export interface OutboxEvent {
  aggregateId: number;
  aggregateType: string;
  eventType: string;
  eventVersion: string;
  payload: string;
  occurredAt: Date;
}

export class JdbcOutboxRepository {
  async insert(tx: TransactionContext, event: OutboxEvent): Promise<void> {
    await tx.query(
      `INSERT INTO outbox_events
       (aggregate_id, aggregate_type, event_type, event_version, payload, occurred_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
      [
        event.aggregateId,
        event.aggregateType,
        event.eventType,
        event.eventVersion,
        event.payload,
        event.occurredAt
      ]
    );
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
