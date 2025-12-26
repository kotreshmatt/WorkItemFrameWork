import { ValidationResult } from './ValidationResult';

export class IdempotencyValidator {

  validate(
    alreadyProcessed: boolean
  ): ValidationResult {

    return alreadyProcessed
      ? ValidationResult.fail('Duplicate command')
      : ValidationResult.ok();
  }
}
