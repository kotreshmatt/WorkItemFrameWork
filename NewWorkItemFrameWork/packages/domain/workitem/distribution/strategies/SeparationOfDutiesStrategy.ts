import { DistributionStrategy } from '../DistributionStrategy';
import { DistributionContext } from '../DistributionContext';
import { DistributionResult } from '../DistributionResult';
import { DistributionStrategyType } from '../../WorkItemDistribution';

export class SeparationOfDutiesStrategy implements DistributionStrategy {
    readonly type = DistributionStrategyType.SEPARATION_OF_DUTIES;
  
    async resolve(context: DistributionContext): Promise<DistributionResult> {
      const excluded = new Set(context.historicalAssignments ?? []);
      const allowed = context.eligibleUsers.filter(u => !excluded.has(u));
      return { selectedUsers: allowed.slice(0, 1) };
    }
  }
  
