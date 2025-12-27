import { WorkItemState } from '../WorkItemState';

export interface TransitionResolver {
  isAllowed(from: WorkItemState, to: WorkItemState): boolean;
}
