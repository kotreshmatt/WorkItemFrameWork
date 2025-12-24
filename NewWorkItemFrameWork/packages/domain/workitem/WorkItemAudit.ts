import { WorkItemState } from './WorkItemState';

export interface WorkItemAudit {
  workItemId: string;
  fromState?: WorkItemState;
  toState: WorkItemState;
  changedBy?: string;
  changedAt: Date;
}
