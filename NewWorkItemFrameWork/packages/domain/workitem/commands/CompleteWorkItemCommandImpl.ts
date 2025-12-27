import { CompleteWorkItemCommand } from './CompleteWorkItemCommand';
import { WorkItemId } from '../WorkItemId';

export class CompleteWorkItemCommandImpl implements CompleteWorkItemCommand {
  constructor(
    public readonly workItemId: WorkItemId,
    public readonly payload: Record<string, unknown>
  ) {}
    output?: Record<string, unknown>;
    initiatedBy!: string;
    initiatedAt!: Date;
}
