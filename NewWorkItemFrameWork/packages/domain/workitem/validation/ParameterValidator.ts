import { ValidationResult } from './ValidationResult';
import { Logger } from '../../common/logging';

export class ParameterValidator {
  constructor(private readonly logger: Logger) {}
  async validateRequired(
    params: Record<string, any>,
    required: string[]
  ): Promise<ValidationResult> {
    this.logger.info(`Starting parameter validation. Required parameters: ${JSON.stringify(required)}`);
    this.logger.debug(`Provided parameters: ${JSON.stringify(params)}`);

    for (const key of required) {
      if (!(key in params)) {
        const errorMessage = `Missing parameter: ${key}`;
        this.logger.error(errorMessage);
        return ValidationResult.fail(errorMessage);
      }
    }

    this.logger.info('All required parameters are present. Validation passed.');
    return ValidationResult.ok();
  }
}