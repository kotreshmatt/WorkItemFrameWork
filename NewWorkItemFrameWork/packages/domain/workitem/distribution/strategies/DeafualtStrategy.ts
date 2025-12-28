import { DistributionStrategy } from '../DistributionStrategy';
import { DistributionContext } from '../DistributionContext';
import { DistributionResult } from '../DistributionResult';
import { DistributionStrategyType } from '../../WorkItemDistribution';

export class DefaultStrategy implements DistributionStrategy {
  readonly type = DistributionStrategyType.DEFAULT;

  async resolve(context: DistributionContext): Promise<DistributionResult> {
    const [first] = context.eligibleUsers;

    return {
      selectedUsers: first ? [first] : []
    };
  }
}
