import { WorkItemId } from '../WorkItemId';
import { WorkItemState } from '../WorkItemState';

export interface WorkItemEvent {
  readonly workItemId: WorkItemId;
  readonly state: WorkItemState;
  readonly occurredAt: Date;
}
