import { WorkItemState } from '../WorkItemState';
import { ValidationResult } from './ValidationResult';

export class LifecycleValidator {

  async validate(
    lifecycleStates: WorkItemState[],
    current: WorkItemState
  ): Promise<ValidationResult> {

    return lifecycleStates.includes(current)
      ? ValidationResult.ok()
      : ValidationResult.fail('State not part of lifecycle');
  }
}
