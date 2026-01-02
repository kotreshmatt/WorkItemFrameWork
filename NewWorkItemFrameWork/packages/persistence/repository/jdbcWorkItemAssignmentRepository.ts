// packages/persistence/repository/JdbcWorkItemAssignmentRepository.ts

import { TransactionContext } from '../common/TransactionContext';

export class JdbcWorkItemAssignmentRepository {

  async isUserOffered(
    tx: TransactionContext,
    workItemId: number,
    userId: string
  ): Promise<boolean> {

    const res = await tx.query(
      `
      SELECT 1
      FROM work_items
      WHERE id = $1
        AND offered_to @> to_jsonb($2::text)
      `,
      [workItemId, userId]
    );

    return res.rowCount > 0;
  }
}
