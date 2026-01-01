import { DistributionContext } from './DistributionContext';
import { DistributionResult } from './DistributionResult';
import { DistributionStrategyType } from '../WorkItemDistribution';

export interface DistributionStrategy {
  readonly type: DistributionStrategyType;
  resolve(context: DistributionContext): Promise<DistributionResult>;
}

export class DefaultStrategy implements DistributionStrategy {
    readonly type = DistributionStrategyType.DEFAULT;
  
    async resolve(context: DistributionContext): Promise<DistributionResult> {
      console.log('[DEBUG] resolvecontext input:', context);
      return {
        selectedUsers: context.eligibleUsers.slice(0, 1)
      };
    }
  }
  