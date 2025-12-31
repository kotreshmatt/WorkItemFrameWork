// packages/domain/workitem/command/handlers/ClaimWorkItemHandler.ts
//import { ClaimWorkItemCommand } from '../../commands/ClaimWorkItemCommand';
import { WorkItemCommandExecutor } from '../../../../persistence/executor/WorkItemCommandExecutor';
import { TransitionWorkItemCommand } from '../TransitionWorkItemCommand';

export class ClaimWorkItemHandler {

  constructor(
    private readonly executor: WorkItemCommandExecutor
  ) {}

  handle(
    command: TransitionWorkItemCommand,
    validationContext: any,
    assignmentContext: any
  ) {
    return this.executor.execute(command, {
      action: 'CLAIM',
      validationContext
      
    });
  }
}
