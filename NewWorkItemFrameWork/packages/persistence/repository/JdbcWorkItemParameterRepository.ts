// packages/persistence/repository/JdbcWorkItemParameterRepository.ts
import { TransactionContext } from '../common/TransactionContext';

export class JdbcWorkItemParameterRepository {

  async insertAll(
    tx: TransactionContext,
    workItemId: number,
    parameters: Array<{
      name: string;
      direction: 'IN' | 'OUT' | 'INOUT';
      mandatory?: boolean;
      value?: unknown;
      
    }>
  ): Promise<void> {

    for (const p of parameters) {
      await tx.query(
        `INSERT INTO work_item_parameters
         (work_item_id, name, value, direction, mandatory)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          workItemId,
          p.name,
          p.value ?? null,
          p.direction,
          p.mandatory ?? false
        ]
      );
    }
  }
} 