import { WorkItemState } from '../WorkItemState';
import { ValidationResult } from './ValidationResult';

export class LifecycleValidator {

  validate(
    lifecycleStates: WorkItemState[],
    current: WorkItemState
  ): ValidationResult {

    return lifecycleStates.includes(current)
      ? ValidationResult.ok()
      : ValidationResult.fail('State not part of lifecycle');
  }
}
