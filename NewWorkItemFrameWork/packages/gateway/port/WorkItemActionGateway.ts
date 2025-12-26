import { ClaimWorkItemCommand } from '../../domain/workitem/commands/ClaimWorkItemCommand';
import { CompleteWorkItemCommand } from '../../domain/workitem/commands/CompleteWorkItemCommand';
import { CancelWorkItemCommand } from '../../domain/workitem/commands/CancelWorkItemCommand';
import { WorkItemCommandResult } from '../../domain/workitem/results/WorkItemCommandResults';

export interface WorkItemActionGateway {

  claim(command: ClaimWorkItemCommand): Promise<WorkItemCommandResult>;

  complete(command: CompleteWorkItemCommand): Promise<WorkItemCommandResult>;

  cancel(command: CancelWorkItemCommand): Promise<WorkItemCommandResult>;
}
