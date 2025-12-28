import { WorkItemState } from '../WorkItemState';
import { AllowedTransitions } from '../WorkItemLifecycle';
import { ValidationResult } from './ValidationResult';
import { Logger } from '../../common/logging';

export class StateTransitionValidator {
  constructor(private readonly logger: Logger) {}

  async validate(
    current: WorkItemState,
    target: WorkItemState
  ): Promise<ValidationResult> {
    this.logger.info(`Validating state transition from ${current} to ${target}`);

    const allowed = AllowedTransitions[current] ?? [];
    this.logger.debug(
      `Allowed transitions for ${current}: ${JSON.stringify(allowed)}`
    );

    if (allowed.includes(target)) {
      this.logger.info(`Transition from ${current} to ${target} is valid`);
      return ValidationResult.ok();
    } else {
      const errorMessage = `Invalid transition from ${current} to ${target}`;
      this.logger.error(errorMessage); // Changed from warn to error
      return ValidationResult.fail(errorMessage);
    }
  }
}