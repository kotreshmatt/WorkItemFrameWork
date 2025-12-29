export class PersistenceError extends Error {}
export class DuplicateKeyError extends PersistenceError {}
export class InvalidReferenceError extends PersistenceError {}
export class ConcurrentModificationError extends PersistenceError {}
export class PersistenceUnavailableError extends PersistenceError {}
