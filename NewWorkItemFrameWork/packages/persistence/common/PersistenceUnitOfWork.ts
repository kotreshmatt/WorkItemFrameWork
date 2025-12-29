
import { TransactionContext } from './TransactionContext';
  
  export interface PersistenceUnitOfWork {
    withTransaction<T>(
      fn: (tx: TransactionContext) => Promise<T>
    ): Promise<T>;
  }
  