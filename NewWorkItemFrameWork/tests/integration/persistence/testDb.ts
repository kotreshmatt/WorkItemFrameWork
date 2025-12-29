import { Pool } from 'pg';
import { JdbcPersistenceUnitOfWork } from '../../../packages/persistence/common/JdbcPersistenceUnitOfWork';
import { Logger } from '../../../packages/domain/common/logging';
import { TestLogger } from '../../utils/TestLogger';

export const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL
});

export const logger: typeof TestLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    trace: function (message: string, meta?: unknown): void {
        throw new Error('Function not implemented.');
    }
};

export function unitOfWork() {
  return new JdbcPersistenceUnitOfWork(pool, logger);
}
