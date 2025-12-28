import { ValidationResult } from './ValidationResult';
import { Logger } from '../../common/logging';

export class IdempotencyValidator {
  constructor(private readonly logger: Logger) {}
  async validate(
    alreadyProcessed: boolean
  ): Promise<ValidationResult> {
    this.logger.info(`Starting idempotency validation. alreadyProcessed: ${alreadyProcessed}`);

    if (alreadyProcessed) {
      const errorMessage = 'Duplicate command detected. Validation failed.';
      this.logger.warn(errorMessage);
      return ValidationResult.fail(errorMessage);
    }

    this.logger.info('Command is not a duplicate. Validation passed.');
    return ValidationResult.ok();
  }
}