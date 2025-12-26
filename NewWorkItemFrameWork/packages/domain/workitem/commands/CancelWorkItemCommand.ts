import { WorkItemCommand } from './WorkItemCommand';

export interface CancelWorkItemCommand extends WorkItemCommand {
  readonly reason?: string;
}
