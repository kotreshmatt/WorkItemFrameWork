import { DomainError } from '../common/DomainError';

export class InvalidWorkItemTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`Invalid transition from ${from} to ${to}`);
  }
}

export class UnauthorizedWorkItemActionError extends DomainError {
  constructor(action: string) {
    super(`Unauthorized action: ${action}`);
  }
}

export class InvalidWorkItemStateError extends DomainError {
  constructor(state: string) {
    super(`Invalid work item state: ${state}`);
  }
}
