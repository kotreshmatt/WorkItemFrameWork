import { TransitionResolver } from './TransitionResolver';
import { DefaultTransitionResolver } from './DefaultTransitionResolver';
import { WorkItemState } from '../WorkItemState';

export class LifecycleEngine {

  private readonly resolver: TransitionResolver;

  constructor(resolver?: TransitionResolver) {
    this.resolver = resolver ?? new DefaultTransitionResolver();
  }

  /** Authoritative initial state resolution */
  getInitialState(lifecycle: string): WorkItemState {
    const state = this.resolver.getInitialState(lifecycle);

    if (!state) {
      throw new Error(
        `No initial state defined for lifecycle '${lifecycle}'`
      );
    }

    return state;
  }

  /** Authoritative transition validation */
  assertTransition(from: WorkItemState, to: WorkItemState): void {
    if (!this.resolver.isAllowed(from, to)) {
      throw new Error(`Invalid lifecycle transition: ${from} → ${to}`);
    }
  }
}
