import { WorkItemState } from './WorkItemState';

export const AllowedTransitions: Record<WorkItemState, WorkItemState[]> = {
  NEW: [WorkItemState.OFFERED],
  OFFERED: [WorkItemState.CLAIMED, WorkItemState.CANCELLED],
  CLAIMED: [WorkItemState.COMPLETED, WorkItemState.CANCELLED],
  COMPLETED: [],
  CANCELLED: []
};
