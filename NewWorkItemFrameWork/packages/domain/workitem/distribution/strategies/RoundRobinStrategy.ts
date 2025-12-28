import { DistributionStrategy } from '../DistributionStrategy';
import { DistributionContext } from '../DistributionContext';
import { DistributionResult } from '../DistributionResult';
import { DistributionStrategyType } from '../../WorkItemDistribution';

export class RoundRobinStrategy implements DistributionStrategy {
    readonly type = DistributionStrategyType.ROUND_ROBIN;
  
    async resolve(context: DistributionContext): Promise<DistributionResult> {
      const users = context.eligibleUsers;
      if (!users.length) return { selectedUsers: [] };
  
      const last = context.historicalAssignments?.slice(-1)[0];
      const idx = last ? (users.indexOf(last) + 1) % users.length : 0;
  
      return { selectedUsers: [users[idx] ?? ''] };
    }
  }
  
