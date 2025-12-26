import { WorkItemId } from '../WorkItemId';
import { WorkItemState } from '../WorkItemState';
import { WorkItemEvent } from './WorkItemEvent';

export class WorkItemCompletedEvent implements WorkItemEvent {
  readonly state = WorkItemState.COMPLETED;
  readonly occurredAt = new Date();

  constructor(
    readonly workItemId: WorkItemId,
    readonly output: Record<string, any>
  ) {}
}
