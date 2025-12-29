import { WorkItemState } from '../WorkItemState';

export interface TransitionResolver {

  /** Is a transition allowed by lifecycle rules */
  isAllowed(from: WorkItemState, to: WorkItemState): boolean;

  /** Initial state of a lifecycle */
  getInitialState(lifecycle: string): WorkItemState;
}
