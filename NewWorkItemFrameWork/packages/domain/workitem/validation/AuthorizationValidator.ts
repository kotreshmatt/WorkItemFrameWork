import { ValidationResult } from './ValidationResult';

export class AuthorizationValidator {

  validate(
    actorId: string,
    assigneeId?: string
  ): ValidationResult {

    if (!assigneeId) {
      return ValidationResult.ok(); // unassigned work item
    }

    return actorId === assigneeId
      ? ValidationResult.ok()
      : ValidationResult.fail('Actor is not assignee');
  }
}
