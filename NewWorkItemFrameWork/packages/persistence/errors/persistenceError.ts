// packages/persistence/errors/PersistenceError.ts

export abstract class PersistenceError extends Error {
    readonly cause: Error | undefined;
  
    protected constructor(message: string, cause?: Error) {
      super(message);
      this.name = this.constructor.name;
      this.cause = cause;
    }
  }
  
  export class DuplicateKeyError extends PersistenceError {
    constructor(message: string, cause?: Error) {
      super(message, cause);
    }
  }
  
  export class InvalidReferenceError extends PersistenceError {
    constructor(message: string, cause?: Error) {
      super(message, cause);
    }
  }
  
  export class ConcurrentModificationError extends PersistenceError {
    constructor(message: string, cause?: Error) {
      super(message, cause);
    }
  }
  
  export class PersistenceUnavailableError extends PersistenceError {
    constructor(message: string, cause?: Error) {
      super(message, cause);
    }
  }
  