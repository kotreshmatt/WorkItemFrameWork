import { TransactionContext } from '../common/TransactionContext';
export class JdbcIdempotencyRepository {
    record(tx: TransactionContext, key: string, arg2: { workItemId: number; action: string; result: { success: boolean; }; }): Promise<unknown> {
        throw new Error('Method not implemented.');
    }

    async tryInsert(
      tx: TransactionContext,
      key: string,
      workItemId: number,
      action: string
    ): Promise<boolean> {
  
      try {
        await tx.query(
          `INSERT INTO idempotency_keys
           (key, work_item_id, action, status)
           VALUES ($1,$2,$3,'STARTED')`,
          [key, workItemId, action]
        );
        return true;
      } catch (e: any) {
        if (e.code === '23505') return false;
        throw e;
      }
    }
  
    async complete(
      tx: TransactionContext,
      key: string,
      result: any
    ): Promise<void> {
  
      await tx.query(
        `UPDATE idempotency_keys
         SET status='COMPLETED', result=$2
         WHERE key=$1`,
        [key, result]
      );
    }
  }
  