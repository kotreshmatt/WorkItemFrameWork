import { WorkItemState } from '../WorkItemState';
import { TransitionResolver } from './TransitionResolver';

export class LifecycleEngine {

  constructor(
    private readonly resolver: TransitionResolver
  ) {}

  canTransition(
    from: WorkItemState,
    to: WorkItemState
  ): boolean {
    return this.resolver.resolve(from, to);
  }
}
