// packages/domain/workitem/commands/handlers/TransitionWorkItemHandler.ts

import { Logger } from '../../../common/logging';
import { TransitionWorkItemCommand } from '../TransitionWorkItemCommand';
import { WorkItemCommandValidationService } from '../../validation-orchestrator/WorkItemCommandValidationService';
import { WorkItemActionGateway } from '../../../../gateway/port/WorkItemActionGateway';
import { CommandExecutionError } from '../errors/CommandExecutionError';
import { TransactionContext } from '../../../../persistence/common/TransactionContext'; 

export class TransitionWorkItemHandler {

  constructor(
    private readonly validator: WorkItemCommandValidationService,
    private readonly actionGateway: WorkItemActionGateway,
    private readonly logger: Logger
  ) {}

  async handle(
    command: TransitionWorkItemCommand,
    validationContext: any,
    resolvedAction: keyof WorkItemActionGateway
  ) {
    this.logger.info('TransitionWorkItem started', {
      action: resolvedAction
    });
    const tx = {} as TransactionContext; // Placeholder for actual transaction context  
    const validation =
      await this.validator.validate(tx,validationContext);

    if (!validation.valid) {
      this.logger.warn('Transition validation failed', validation);
      return validation;
    }

    try {
      const result =
        await this.actionGateway[resolvedAction](command as any);

      this.logger.info('TransitionWorkItem completed');
      return result;

    } catch (err) {
      this.logger.error('TransitionWorkItem failed', err);
      throw new CommandExecutionError('TransitionWorkItem failed', err);
    }
  }
}
