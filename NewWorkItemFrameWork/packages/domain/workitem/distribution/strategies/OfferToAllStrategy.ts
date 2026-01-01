import { DistributionStrategyType } from '../../WorkItemDistribution';
import { DistributionContext } from '../DistributionContext';
import { DistributionResult } from '../DistributionResult';
import { DistributionStrategy } from '../DistributionStrategy';

export class OfferToAllStrategy implements DistributionStrategy {
  readonly type = DistributionStrategyType.DEFAULT;

  // Minimal implementation of the resolve method
  async resolve(context: DistributionContext): Promise<DistributionResult> {
    // No actual logic needed for now
    return { selectedUsers: context.eligibleUsers ?? [] };
  }
}