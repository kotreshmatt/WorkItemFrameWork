// packages/domain/workitem/commands/handlers/CreateWorkItemHandler.ts

import { LifecycleEngine } from '../../Lifecycle/LifecycleEngine';
import { AssignmentResolver } from '../../assignment/AssignmentResolver';
import { Logger } from '../../../common/logging';
import { CreateWorkItemCommand } from '../CreateWorkItemCommand';
import { CreateWorkItemDecision } from '../../results/CreateWorkItemDecision';
import { DistributionStrategyType, DistributionMode } from '../../WorkItemDistribution';

export class CreateWorkItemHandler {

  constructor(
    private readonly lifecycleEngine: LifecycleEngine,
    private readonly assignmentResolver: AssignmentResolver,
    private readonly logger: Logger
  ) {}

  async handle(
    command: CreateWorkItemCommand
  ): Promise<CreateWorkItemDecision> {

    this.logger.info('CreateWorkItem started', {
      workflowId: command.workflowId,
      taskName: command.taskName
    });

    // 1. Resolve initial lifecycle state
    const initialState =
      this.lifecycleEngine.getInitialState(command.lifecycle);

    // 2. Resolve assignment OFFER (Phase-2 logic only)
    const assignmentDecision =
      await this.assignmentResolver.resolve({
        strategy: command.assignmentSpec.strategy as DistributionStrategyType,
        mode: command.assignmentSpec.mode as DistributionMode,
        distributionContext: {
          eligibleUsers: []   // derived later from org model (Phase-4+)
        }
      });

    this.logger.info('CreateWorkItem decision resolved', {
      initialState,
      offeredTo: [] // Placeholder for an empty array, replace with actual data if needed
    });

    // 3. Return decision ONLY
    return {
      initialState,
      assignmentDecision: {
        offeredTo: assignmentDecision.offeredTo
      },
      lifecycleName: command.lifecycle // Ensure `command.lifecycle` is a string
    };
  }
}
