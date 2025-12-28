import { DistributionStrategyType } from '../WorkItemDistribution';

export interface DistributionConfig {
  enabledStrategies: DistributionStrategyType[];
  defaultStrategy: DistributionStrategyType;
  seed?: number;
}
