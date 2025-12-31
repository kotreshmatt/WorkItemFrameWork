// packages/domain/workitem/command/handlers/CompleteWorkItemHandler.ts
//import { CompleteWorkItemCommand } from '../../commands/CompleteWorkItemCommand';
import { WorkItemCommandExecutor } from '../../../../persistence/executor/WorkItemCommandExecutor';
import { TransitionWorkItemCommand } from '../TransitionWorkItemCommand';

export class CompleteWorkItemHandler {

  constructor(
    private readonly executor: WorkItemCommandExecutor
  ) {}

  handle(
    command: TransitionWorkItemCommand,
    validationContext: any
  ) {
    return this.executor.execute(command, {
      action: 'COMPLETE',
      validationContext
    });
  }
}
