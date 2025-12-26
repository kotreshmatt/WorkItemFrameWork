import { WorkItemId } from '../WorkItemId';
import { WorkItemState } from '../WorkItemState';
import { WorkItemEvent } from './WorkItemEvent';

export class WorkItemClaimedEvent implements WorkItemEvent {
  readonly state = WorkItemState.CLAIMED;
  readonly occurredAt = new Date();

  constructor(
    readonly workItemId: WorkItemId,
    readonly userId: string
  ) {}
}
