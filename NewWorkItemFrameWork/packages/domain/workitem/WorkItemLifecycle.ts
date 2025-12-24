import { WorkItemState } from './WorkItemState';

export const AllowedTransitions: Record<WorkItemState, WorkItemState[]> = {
  NEW: [WorkItemState.ACTIVE],
  ACTIVE: [WorkItemState.CLAIMED, WorkItemState.CANCELLED],
  CLAIMED: [WorkItemState.COMPLETED, WorkItemState.CANCELLED],
  COMPLETED: [],
  CANCELLED: []
};
