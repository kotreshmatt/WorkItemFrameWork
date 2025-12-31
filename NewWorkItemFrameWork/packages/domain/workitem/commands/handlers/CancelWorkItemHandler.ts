// packages/domain/workitem/command/handlers/CancelWorkItemHandler.ts
//import { CancelWorkItemCommand } from '../../commands/CancelWorkItemCommand';
import { WorkItemCommandExecutor } from '../../../../persistence/executor/WorkItemCommandExecutor';
import { TransitionWorkItemCommand } from '../TransitionWorkItemCommand';

export class CancelWorkItemHandler {

  constructor(
    private readonly executor: WorkItemCommandExecutor
  ) {}

  handle(
    command: TransitionWorkItemCommand,
    validationContext: any
  ) {
    return this.executor.execute(command, {
      action: 'CANCEL',
      validationContext
    });
  }
}
