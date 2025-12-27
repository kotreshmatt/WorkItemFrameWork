import { TransitionResolver } from './TransitionResolver';
import { WorkItemState } from '../WorkItemState';

const ALLOWED: Record<WorkItemState, WorkItemState[]> = {
  NEW: [WorkItemState.ACTIVE],
  ACTIVE: [WorkItemState.CLAIMED, WorkItemState.CANCELLED],
  CLAIMED: [WorkItemState.COMPLETED, WorkItemState.CANCELLED],
  COMPLETED: [],
  CANCELLED: []
};

export class DefaultTransitionResolver implements TransitionResolver {
  isAllowed(from: WorkItemState, to: WorkItemState): boolean {
    return ALLOWED[from]?.includes(to) ?? false;
  }
}
