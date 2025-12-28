import { WorkItemState } from '../WorkItemState';
import { ValidationResult } from './ValidationResult';
import { Logger } from '../../common/logging';

export class LifecycleValidator {
  constructor(private readonly logger: Logger) {}
  async validate(
    lifecycleStates: WorkItemState[],
    current: WorkItemState
  ): Promise<ValidationResult> {
    this.logger.info(`Starting lifecycle validation for current state: ${current}`);
    this.logger.debug(`Lifecycle states: ${JSON.stringify(lifecycleStates)}`);

    if (lifecycleStates.includes(current)) {
      this.logger.info(`Validation passed: Current state (${current}) is part of the lifecycle.`);
      return ValidationResult.ok();
    } else {
      const errorMessage = `Validation failed: Current state (${current}) is not part of the lifecycle.`;
      this.logger.error(errorMessage);
      return ValidationResult.fail(errorMessage);
    }
  }
}