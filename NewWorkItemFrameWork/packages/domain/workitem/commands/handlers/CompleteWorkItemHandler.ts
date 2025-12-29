// packages/domain/workitem/command/handlers/CompleteWorkItemHandler.ts
import { CompleteWorkItemCommand } from '../../commands/CompleteWorkItemCommand';
import { WorkItemCommandService } from '../WorkItemCommandService';

export class CompleteWorkItemHandler {

  constructor(
    private readonly commandService: WorkItemCommandService
  ) {}

  handle(
    command: CompleteWorkItemCommand,
    validationContext: any
  ) {
    return this.commandService.execute(command, {
      action: 'complete',
      validationContext
    });
  }
}
