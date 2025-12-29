import { AssignmentResolver } from '../../assignment/AssignmentResolver';
import { LifecycleEngine } from '../../Lifecycle/LifecycleEngine';
import { Logger } from '../../../common/logging';
import { CreateWorkItemCommand } from '../CreateWorkItemCommand';
import { CreateWorkItemDecision } from '../../results/CreateWorkItemDecision';
import { DistributionContext } from '../../distribution/DistributionContext';

export class CreateWorkItemHandler {

  constructor(
    private readonly assignmentResolver: AssignmentResolver,
    private readonly lifecycleEngine: LifecycleEngine,
    private readonly logger: Logger
  ) {}

  async handle(
    command: CreateWorkItemCommand
  ): Promise<CreateWorkItemDecision> {

    this.logger.info('CreateWorkItemHandler invoked', {
      workflowId: command.workflowId,
      taskName: command.taskName
    });

    /** Phase-1 & Phase-2 assume lifecycle already validated upstream */

    const initialState =
      this.lifecycleEngine.getInitialState(command.lifecycle);

    /** Build DistributionContext (Phase-3 responsibility) */
    const distributionContext: DistributionContext = {
      eligibleUsers: command.candidateUsers ?? [],
      historicalAssignments: [],
      config: command.distributionConfig
    };

    /** Correct async call */
    const assignmentDecision =
      await this.assignmentResolver.resolve({
        strategy: command.strategy,
        mode: command.mode,
        distributionContext
      });

    this.logger.info('CreateWorkItem decision completed', {
      offeredTo: assignmentDecision.offeredTo,
      assignedTo: assignmentDecision.assignedTo
    });

    /** NO WorkItemId here – DB generates it in Phase-4 */
    return {
      initialState,
      assignmentDecision
    };
  }
}
