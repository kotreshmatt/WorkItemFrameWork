import { ValidationResult } from './ValidationResult';

export class AuthorizationValidator {

  async validate(
    actorId: string,
    assigneeId?: string
  ): Promise<ValidationResult> {

    if (!assigneeId) {
      return ValidationResult.ok(); // unassigned work item
    }

    return actorId === assigneeId
      ? ValidationResult.ok()
      : ValidationResult.fail('Actor is not assignee');
  }
}
