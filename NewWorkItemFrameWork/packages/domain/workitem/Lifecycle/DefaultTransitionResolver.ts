
import { TransitionResolver } from './TransitionResolver';
import { WorkItemState } from '../WorkItemState';

/**
 * Default BPM-style lifecycle:
 *
 * NEW -> ACTIVE -> CLAIMED -> COMPLETED
 *                  └──────> CANCELLED
 */
export class DefaultTransitionResolver implements TransitionResolver {

  private readonly transitions: Record<WorkItemState, WorkItemState[]> = {
    [WorkItemState.NEW]: [WorkItemState.OFFERED],
    [WorkItemState.OFFERED]: [WorkItemState.CLAIMED, WorkItemState.CANCELLED],
    [WorkItemState.CLAIMED]: [WorkItemState.COMPLETED, WorkItemState.CANCELLED],
    [WorkItemState.COMPLETED]: [],
    [WorkItemState.CANCELLED]: []
  };

  isAllowed(from: WorkItemState, to: WorkItemState): boolean {
    return this.transitions[from]?.includes(to) ?? false;
  }

  getInitialState(_lifecycle: string): WorkItemState {
    // Phase-1: lifecycle name ignored, default BPM lifecycle
    // Phase-2+: plug lifecycle definitions here
    return WorkItemState.NEW;
  }
}
