import { WorkItemState } from '../WorkItemState';
import { AllowedTransitions } from '../WorkItemLifecycle';
import { ValidationResult } from './ValidationResult';

export class StateTransitionValidator {

  async validate(
    current: WorkItemState,
    target: WorkItemState
  ): Promise<ValidationResult> {

    const allowed = AllowedTransitions[current] ?? [];

    return allowed.includes(target)
      ? ValidationResult.ok()
      : ValidationResult.fail(
          `Invalid transition from ${current} to ${target}`
        );
  }
}
