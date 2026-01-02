// packages/persistence/repository/JdbcWorkItemParticipantRepository.ts
import { TransactionContext } from '../common/TransactionContext';

export class JdbcWorkItemParticipantRepository {

  async insertOfferedUsers(
    tx: TransactionContext,
    workItemId: number,
    userIds: string[]
  ): Promise<void> {

    for (const userId of userIds) {
      await tx.query(
        `INSERT INTO work_item_participant
         (work_item_id, participant_id, participant_type)
         VALUES ($1, $2, 'USER')`,
        [workItemId, userId]
      );
    }
  }

  async assign(
    tx: TransactionContext,
    workItemId: number,
    userId: string
  ): Promise<void> {
      console.log(`[INFO] Assigning user ${userId} to work item ${workItemId}`);
    await tx.query(
      `INSERT INTO work_item_participant
       (work_item_id, participant_id, participant_type,role,created_at,updated_at)
       VALUES ($1, $2, 'USER', 'ASSIGNEE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      [workItemId, userId]
    );
  }
}
