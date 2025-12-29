// packages/domain/workitem/command/handlers/ClaimWorkItemHandler.ts
import { ClaimWorkItemCommand } from '../../commands/ClaimWorkItemCommand';
import { WorkItemCommandService } from '../WorkItemCommandService';

export class ClaimWorkItemHandler {

  constructor(
    private readonly commandService: WorkItemCommandService
  ) {}

  handle(
    command: ClaimWorkItemCommand,
    validationContext: any,
    assignmentContext: any
  ) {
    return this.commandService.execute(command, {
      action: 'claim',
      validationContext,
      assignmentContext
    });
  }
}
