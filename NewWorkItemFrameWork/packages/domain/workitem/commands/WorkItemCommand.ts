import { WorkItemId } from '../WorkItemId';

export interface WorkItemCommand {
  readonly workItemId: WorkItemId;
  readonly initiatedBy: string;
  readonly initiatedAt: Date;
}
