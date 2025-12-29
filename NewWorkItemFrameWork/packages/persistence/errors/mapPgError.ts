// packages/persistence/errors/mapPgError.ts

import {
    DuplicateKeyError,
    InvalidReferenceError,
    PersistenceUnavailableError,
    ConcurrentModificationError
  } from './persistenceError';
  
  export function mapPgError(err: any): never {
    const code = err?.code;
  
    switch (code) {
      case '23505': // unique_violation
        throw new DuplicateKeyError(
          err.detail ?? 'Duplicate key violation',
          err
        );
  
      case '23503': // foreign_key_violation
        throw new InvalidReferenceError(
          err.detail ?? 'Invalid reference',
          err
        );
  
      case '40001': // serialization_failure
        throw new ConcurrentModificationError(
          'Concurrent modification detected',
          err
        );
  
      default:
        throw new PersistenceUnavailableError(
          err?.message ?? 'Database error',
          err
        );
    }
  }
  