// packages/domain/workitem/command/WorkItemCommandService.ts
import { Logger } from '../../common/logging';
import { WorkItemCommandValidationService } from '../validation-orchestrator/WorkItemCommandValidationService';
import { LifecycleEngine } from '../Lifecycle/LifecycleEngine';
import { AssignmentResolver } from '../assignment/AssignmentResolver';
import { WorkItemActionGateway } from '../../../gateway/port/WorkItemActionGateway';
import { CommandExecutionError } from './errors/CommandExecutionError';

export class WorkItemCommandService {

  constructor(
    private readonly validator: WorkItemCommandValidationService,
    private readonly lifecycleEngine: LifecycleEngine,
    private readonly assignmentResolver: AssignmentResolver,
    private readonly actionGateway: WorkItemActionGateway,
    private readonly logger: Logger
  ) {}

  async execute(
    command: unknown,
    context: {
      action: keyof WorkItemActionGateway;
      validationContext: any;
      assignmentContext?: any;
    }
  ) {
    this.logger.info('Command execution started', {
      action: context.action
    });

    const validationResult =
      await this.validator.validate(context.validationContext);

    if (!validationResult.valid) {
      this.logger.warn('Command validation failed', validationResult);
      return validationResult;
    }

    try {
      if (context.assignmentContext) {
        const assignment =
          this.assignmentResolver.resolve(context.assignmentContext);

        this.logger.debug('Assignment resolved', assignment);
      }

      const result =
        await this.actionGateway[context.action](command as any);

      this.logger.info('Command execution completed', {
        action: context.action
      });

      return result;

    } catch (err) {
      this.logger.error('Command execution failed', err);
      throw new CommandExecutionError('Command execution failed', err);
    }
  }
}
