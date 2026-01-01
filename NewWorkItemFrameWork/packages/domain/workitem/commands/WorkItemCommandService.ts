import { Logger } from '../../common/logging';
import { WorkItemCommandValidationService } from '../validation-orchestrator/WorkItemCommandValidationService';
import { CommandDecision } from '../results/CommandDecision';

export interface CommandExecutionContext {
  action: 'CREATE' | 'CLAIM' | 'COMPLETE' | 'CANCEL' | 'TRANSITION';
  validationContext: any;
}

export class WorkItemCommandService {

  constructor(
    private readonly validator: WorkItemCommandValidationService,
    private readonly logger: Logger
  ) {}

  async decide(
    context: CommandExecutionContext
  ): Promise<CommandDecision> {

    this.logger.debug('Command decision started', {
      action: context.action
    });

    /* -------------------------------------------------
     * CREATE → no validation, no workItem
     * ------------------------------------------------- */
    if (context.action === 'CREATE') {

      this.logger.info('CREATE command accepted');

      return CommandDecision.acceptedCreate({
        initialState: 'OFFERED'
      });
    }

    /* -------------------------------------------------
     * TRANSITIONS → full validation pipeline
     * ------------------------------------------------- */
    else{
    const validationResult =
      await this.validator.validate(context.validationContext);

    if (!validationResult.valid) {
      this.logger.warn('Command rejected by validation', validationResult);
      return CommandDecision.rejected(validationResult);
    }

    const { workItem, targetState } = context.validationContext;

    this.logger.info('Command accepted', {
      workItemId: workItem.id,
      fromState: workItem.state,
      toState: targetState
    });

    return CommandDecision.acceptedTransition({
      fromState: workItem.state,
      toState: targetState
    });
  }
  }
}
