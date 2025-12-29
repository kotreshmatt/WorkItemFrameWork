import { WorkItemState } from './WorkItemState';
import { WorkItemAssignmentSpec } from './WorkItemAssignmentSpec';

export interface WorkItemDraft {
  readonly workflowId: string;
  readonly runId: string;
  readonly taskName: string;
  readonly type: string;
  readonly state: WorkItemState;
  readonly assignmentSpec: WorkItemAssignmentSpec;
  readonly parameters: Record<string, unknown>;
}
