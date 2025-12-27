import { TransitionResolver } from './TransitionResolver';
import { DefaultTransitionResolver } from './DefaultTransitionResolver';
import { WorkItemState } from '../WorkItemState';

export class LifecycleEngine {
  private readonly resolver: TransitionResolver;

  constructor(resolver?: TransitionResolver) {
    this.resolver = resolver ?? new DefaultTransitionResolver();
  }

  assertTransition(from: WorkItemState, to: WorkItemState): void {
    if (!this.resolver.isAllowed(from, to)) {
      throw new Error(`Invalid lifecycle transition: ${from} → ${to}`);
    }
  }
}
