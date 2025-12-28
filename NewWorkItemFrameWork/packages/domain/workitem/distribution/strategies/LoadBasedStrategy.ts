import { DistributionStrategy } from '../DistributionStrategy';
import { DistributionContext } from '../DistributionContext';
import { DistributionResult } from '../DistributionResult';
import { DistributionStrategyType } from '../../WorkItemDistribution';

export class LoadBasedStrategy implements DistributionStrategy {
    readonly type = DistributionStrategyType.LOAD_BASED;
  
    async resolve(context: DistributionContext): Promise<DistributionResult> {
      return {
        selectedUsers: context.eligibleUsers.slice(0, 1)
      };
    }
  }
  
