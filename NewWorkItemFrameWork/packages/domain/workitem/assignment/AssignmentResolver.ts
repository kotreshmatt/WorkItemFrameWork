import { DistributionStrategyRegistry } from '../distribution/strategies/DistributionStrategyRegistry';
import { OfferResolver } from '../distribution/OfferResolver';
import { DistributionMode, DistributionStrategyType } from '../WorkItemDistribution';
import { DistributionContext } from '../distribution/DistributionContext';
import { Logger } from '../../common/logging';

export interface AssignmentContext {
  strategy: DistributionStrategyType;
  mode: DistributionMode;
  distributionContext: DistributionContext;
}

export interface AssignmentResult {
  offeredTo: string[];
  assignedTo?: string;
}

export class AssignmentResolver {

  constructor(
    private readonly strategyRegistry: DistributionStrategyRegistry,
    private readonly offerResolver: OfferResolver,
    private readonly logger: Logger
  ) {}

  async resolve(context: AssignmentContext): Promise<AssignmentResult> {

    this.logger.debug('Resolving assignment', context);

    const strategy =
      this.strategyRegistry.get(context.strategy,
        [context.strategy],
        context.strategy);

    const distributionResult =
      await strategy.resolve(context.distributionContext);

    const offerResult =
      this.offerResolver.resolve(
        distributionResult.selectedUsers,
        context.mode
      );

    this.logger.info('Assignment resolved', JSON.stringify(offerResult));

    return offerResult;
  }
}
