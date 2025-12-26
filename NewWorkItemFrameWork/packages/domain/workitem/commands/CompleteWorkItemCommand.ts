import { WorkItemCommand } from './WorkItemCommand';

export interface CompleteWorkItemCommand extends WorkItemCommand {
  readonly output?: Record<string, unknown>;
}
