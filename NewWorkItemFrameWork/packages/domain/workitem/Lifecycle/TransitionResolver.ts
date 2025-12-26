import { WorkItemState } from '../WorkItemState';
import { AllowedTransitions } from '../WorkItemLifecycle';

export class TransitionResolver {

  resolve(
    current: WorkItemState,
    target: WorkItemState
  ): boolean {
    return AllowedTransitions[current]?.includes(target) ?? false;
  }
}
