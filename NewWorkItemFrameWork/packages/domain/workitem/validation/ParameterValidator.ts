import { ValidationResult } from './ValidationResult';

export class ParameterValidator {

  async validateRequired(
    params: Record<string, any>,
    required: string[]
  ): Promise<ValidationResult> {

    for (const key of required) {
      if (!(key in params)) {
        return ValidationResult.fail(`Missing parameter: ${key}`);
      }
    }
    return ValidationResult.ok();
  }
}
