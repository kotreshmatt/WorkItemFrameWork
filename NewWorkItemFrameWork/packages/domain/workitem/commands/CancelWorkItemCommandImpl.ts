import { CancelWorkItemCommand } from './CancelWorkItemCommand';
import { WorkItemId } from '../WorkItemId';

export class CancelWorkItemCommandImpl implements CancelWorkItemCommand {
  constructor(public readonly workItemId: WorkItemId) {}
    reason?: string;
    initiatedBy!: string;
    initiatedAt!: Date;
}
