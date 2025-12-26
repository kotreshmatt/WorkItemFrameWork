import { WorkItemId } from '../WorkItemId';
import { WorkItemState } from '../WorkItemState';

export interface WorkItemCommandResult {
  readonly workItemId: WorkItemId;
  readonly success: boolean;
  readonly resultingState?: WorkItemState;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}
