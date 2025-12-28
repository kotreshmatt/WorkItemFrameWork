import { DistributionStrategy } from '../DistributionStrategy';
import { DistributionContext } from '../DistributionContext';
import { DistributionResult } from '../DistributionResult';
import { DistributionStrategyType } from '../../WorkItemDistribution';

export class RandomStrategy implements DistributionStrategy {
    readonly type = DistributionStrategyType.RANDOM;
  
    async resolve(context: DistributionContext): Promise<DistributionResult> {
      const users = context.eligibleUsers.filter((user): user is string => user !== undefined);
      if (!users.length) return { selectedUsers: [] };
  
      const seed = context.config?.seed ?? 1;
      const index = seed % users.length;
  
      return { selectedUsers: users[index] ? [users[index]] : [] };
    }
  }
  
