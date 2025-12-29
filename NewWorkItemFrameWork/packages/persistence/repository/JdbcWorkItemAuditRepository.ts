import { TransactionContext } from '../common/TransactionContext';

export class JdbcWorkItemAuditRepository {
  insert(tx: TransactionContext, arg1: { workItemId: number; action: string; toState: string; actorId: string; }) {
      throw new Error('Method not implemented.');
  }

  async append(tx: TransactionContext, audit: {
    workItemId: number;
    action: string;
    fromState?: string;
    toState?: string;
    actorId?: string;
    details?: any;
  }): Promise<void> {

    await tx.query(
      `INSERT INTO work_item_audit
       (work_item_id, action, from_state, to_state, actor_id, details)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        audit.workItemId,
        audit.action,
        audit.fromState ?? null,
        audit.toState ?? null,
        audit.actorId ?? null,
        audit.details ?? {}
      ]
    );
  }
}
