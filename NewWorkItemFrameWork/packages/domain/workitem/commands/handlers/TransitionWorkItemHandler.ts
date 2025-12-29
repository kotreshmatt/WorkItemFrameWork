// packages/domain/workitem/command/handlers/TransitionWorkItemHandler.ts
import { TransitionWorkItemCommand } from '../../commands/TransitionWorkItemCommand';
import { WorkItemCommandService } from '../WorkItemCommandService';

export class TransitionWorkItemHandler {

  constructor(
    private readonly commandService: WorkItemCommandService
  ) {}

  handle(
    command: TransitionWorkItemCommand,
    validationContext: any
  ) {
    return this.commandService.execute(command, {
      action: 'transition',
      validationContext
    });
  }
}
