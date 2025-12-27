import { ClaimWorkItemCommand } from './ClaimWorkItemCommand';
import { WorkItemId } from '../WorkItemId';

export class ClaimWorkItemCommandImpl implements ClaimWorkItemCommand {
  constructor(
    public readonly workItemId: WorkItemId,
    public readonly userId: string
  ) {}
    initiatedBy!: string;
    initiatedAt!: Date;
}
