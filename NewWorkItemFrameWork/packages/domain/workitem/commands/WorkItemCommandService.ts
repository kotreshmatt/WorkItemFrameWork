// packages/domain/workitem/commands/WorkItemCommandService.ts

import { Logger } from '../../common/logging';
import { WorkItemCommandValidationService } from '../validation-orchestrator/WorkItemCommandValidationService';
import { LifecycleEngine } from '../Lifecycle/LifecycleEngine';
import { AssignmentResolver } from '../assignment/AssignmentResolver';
import { CommandDecision } from '../results/CommandDecision';

export interface CommandExecutionContext {
  readonly validationContext: any;
  readonly assignmentContext?: any;
}

export class WorkItemCommandService {

  constructor(
    private readonly validator: WorkItemCommandValidationService,
    private readonly lifecycleEngine: LifecycleEngine,
    private readonly assignmentResolver: AssignmentResolver,
    private readonly logger: Logger
  ) {}

  async decide(
    context: CommandExecutionContext
  ): Promise<CommandDecision> {

    this.logger.info('Command decision started');

    // 1️⃣ Validation
    const validationResult =
      await this.validator.validate(context.validationContext);

    if (!validationResult.valid) {
      return CommandDecision.rejected(validationResult);
    }

    const { fromState, targetState, lifecycle } = context.validationContext;

    // 2️⃣ CREATE
    if (!fromState && lifecycle) {
      const initialState =
        this.lifecycleEngine.getInitialState(lifecycle);

      let assignmentDecision;
      if (context.assignmentContext) {
        assignmentDecision =
          await this.assignmentResolver.resolve(context.assignmentContext);
      }

      return CommandDecision.acceptedCreate({
        initialState,
        assignmentDecision
      });
    }

    // 3️⃣ TRANSITION
    if (fromState && targetState) {
      this.lifecycleEngine.assertTransition(fromState, targetState);

      return CommandDecision.acceptedTransition({
        fromState,
        toState: targetState
      });
    }

    throw new Error('Invalid command context');
  }
}
