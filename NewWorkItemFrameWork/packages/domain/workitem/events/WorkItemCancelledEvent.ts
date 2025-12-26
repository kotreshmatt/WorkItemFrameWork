import { WorkItemId } from '../WorkItemId';
import { WorkItemState } from '../WorkItemState';
import { WorkItemEvent } from './WorkItemEvent';

export class WorkItemCancelledEvent implements WorkItemEvent {
  readonly state = WorkItemState.CANCELLED;
  readonly occurredAt = new Date();

  constructor(
    readonly workItemId: WorkItemId,
    readonly reason?: string
  ) {}
}
