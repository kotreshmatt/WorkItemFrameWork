import { WorkItem } from '../WorkItem';
import { WorkItemState } from '../WorkItemState';

export interface ValidationContext {
  workItem: WorkItem;
  actorId: string;
  targetState: WorkItemState;
  parameters?: Record<string, any>;
  idempotent?: boolean;
}
