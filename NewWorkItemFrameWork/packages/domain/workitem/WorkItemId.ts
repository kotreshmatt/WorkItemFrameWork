import { DomainError } from '../common/DomainError';

export class InvalidWorkItemIdError extends DomainError {
  constructor(value: unknown) {
    super(`Invalid WorkItemId: ${value}`);
  }
}

/**
 * Value Object for WorkItem identifier.
 * Backed by auto-increment integer in DB.
 */
export class WorkItemId {
  private constructor(private readonly value: number) {}

  /**
   * Use ONLY when ID is already generated (DB-loaded entities)
   */
  static of(value: number): WorkItemId {
    if (!Number.isInteger(value) || value <= 0) {
      throw new InvalidWorkItemIdError(value);
    }
    return new WorkItemId(value);
  }

  /**
   * Used for transient WorkItems before persistence
   */
  static unassigned(): WorkItemId {
    return new WorkItemId(-1);
  }

  isAssigned(): boolean {
    return this.value > 0;
  }

  get(): number {
    if (!this.isAssigned()) {
      throw new InvalidWorkItemIdError('UNASSIGNED');
    }
    return this.value;
  }

  equals(other: WorkItemId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.isAssigned() ? this.value.toString() : 'UNASSIGNED';
  }
}
