import { ValidationResult } from './ValidationResult';

export class IdempotencyValidator {

  async validate(
    alreadyProcessed: boolean
  ): Promise<ValidationResult> {

    return alreadyProcessed
      ? ValidationResult.fail('Duplicate command')
      : ValidationResult.ok();
  }
}
