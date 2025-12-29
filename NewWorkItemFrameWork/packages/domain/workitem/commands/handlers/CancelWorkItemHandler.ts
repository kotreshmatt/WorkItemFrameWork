// packages/domain/workitem/command/handlers/CancelWorkItemHandler.ts
import { CancelWorkItemCommand } from '../../commands/CancelWorkItemCommand';
import { WorkItemCommandService } from '../WorkItemCommandService';

export class CancelWorkItemHandler {

  constructor(
    private readonly commandService: WorkItemCommandService
  ) {}

  handle(
    command: CancelWorkItemCommand,
    validationContext: any
  ) {
    return this.commandService.execute(command, {
      action: 'cancel',
      validationContext
    });
  }
}
