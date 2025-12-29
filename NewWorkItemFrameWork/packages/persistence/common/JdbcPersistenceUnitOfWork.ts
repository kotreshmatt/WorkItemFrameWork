import { Logger } from '../../domain/common/logging';
import { TransactionContext } from './TransactionContext';
import { PersistenceUnitOfWork } from './PersistenceUnitOfWork';

interface PgClient {
  query<T = any>(
    sql: string,
    params?: readonly any[]
  ): Promise<{ rows: T[]; rowCount: number }>;
  release(): void;
}

interface PgPool {
  connect(): Promise<PgClient>;
}

export class JdbcPersistenceUnitOfWork implements PersistenceUnitOfWork {
  [x: string]: any;

  constructor(
    private readonly pool: PgPool,
    private readonly logger: Logger
  ) {}

  async withTransaction<T>(fn: (tx: TransactionContext) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      this.logger.debug('TX BEGIN');

      const tx: TransactionContext = {
        query: (sql, params) => client.query(sql, params)
      };

      const result = await fn(tx);

      await client.query('COMMIT');
      this.logger.info('TX COMMIT');
      return result;

    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.error('TX ROLLBACK', err);
      throw err;
    } finally {
      client.release();
    }
  }
}
