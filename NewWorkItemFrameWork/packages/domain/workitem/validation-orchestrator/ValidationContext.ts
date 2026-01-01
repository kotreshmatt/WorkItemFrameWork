import { WorkItem } from '../WorkItem';
import { WorkItemState } from '../WorkItemState';

export interface ValidationContext {
  action: 'CREATE' | 'CLAIM' | 'COMPLETE' | 'CANCEL' | 'TRANSITION';
  workItem: WorkItem;
  actorId: string;
  targetState: WorkItemState;
  parameters?: Record<string, any>;
  idempotent?: boolean;
}
