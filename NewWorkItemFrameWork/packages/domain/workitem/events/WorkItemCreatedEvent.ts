import { WorkItemId } from '../WorkItemId';
import { WorkItemState } from '../WorkItemState';
import { WorkItemAssignmentSpec } from '../WorkItemAssignmentSpec';
import { WorkItemEvent } from './WorkItemEvent';

export class WorkItemCreatedEvent implements WorkItemEvent {
  readonly state = WorkItemState.NEW;
  readonly occurredAt = new Date();

  constructor(
    readonly workItemId: WorkItemId,
    readonly type: string,
    readonly workflowId: string,
    readonly runId: string,
    readonly taskName: string,
    readonly assignmentSpec: WorkItemAssignmentSpec
  ) {}
}
