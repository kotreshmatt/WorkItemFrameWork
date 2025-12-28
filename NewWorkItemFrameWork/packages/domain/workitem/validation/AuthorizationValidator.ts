import { ValidationResult } from './ValidationResult';
import { Logger } from '../../common/logging';

export class AuthorizationValidator {
  constructor(private readonly logger: Logger) {}

  async validate(
    actorId: string,
    assigneeId?: string
  ): Promise<ValidationResult> {
    this.logger.info(
      `Starting authorization validation for actorId: ${actorId}, assigneeId: ${assigneeId}`
    );

    if (!assigneeId) {
      this.logger.info(
        `Authorization validation passed: Work item is unassigned, actorId: ${actorId} is authorized`
      );
      return ValidationResult.ok(); // unassigned work item
    }

    if (actorId === assigneeId) {
      this.logger.info(
        `Authorization validation passed: actorId: ${actorId} matches assigneeId: ${assigneeId}`
      );
      return ValidationResult.ok();
    } else {
      const errorMessage = `Authorization validation failed: actorId: ${actorId} does not match assigneeId: ${assigneeId}`;
      this.logger.error(errorMessage);
      return ValidationResult.fail(errorMessage);
    }
  }
}