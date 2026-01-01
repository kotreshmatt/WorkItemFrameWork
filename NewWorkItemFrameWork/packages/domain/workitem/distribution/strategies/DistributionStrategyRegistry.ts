import { DistributionStrategy } from '../DistributionStrategy';
import { DistributionStrategyType } from '../../WorkItemDistribution';
import { OfferToAllStrategy } from './OfferToAllStrategy';

export class DistributionStrategyRegistry {

  private readonly strategies = new Map<
    DistributionStrategyType,
    DistributionStrategy
  >();

  register(strategy: DistributionStrategy): void {
    console.log(`[DEBUG] Registering strategy: ${strategy.type}`);
    this.strategies.set(strategy.type, strategy);
  }
 
  get(
    type: DistributionStrategyType,
    enabled: DistributionStrategyType[],
    fallback: DistributionStrategyType
  ): DistributionStrategy {

    if (!enabled.includes(type)) {
      const fallbackStrategy = this.strategies.get(fallback);
      if (!fallbackStrategy) {
        throw new Error(`Fallback strategy ${fallback} not registered`);
      }
      return fallbackStrategy;
    }

    const strategy = this.strategies.get(type);
    if (!strategy) {
      throw new Error(`Strategy ${type} not registered`);
    }

    return strategy;
  }
}

// Create an instance of the registry
const strategyRegistry = new DistributionStrategyRegistry();

// Register the 'OFFER_TO_ALL' strategy
strategyRegistry.register(new OfferToAllStrategy());

// Export the registry instance
export default strategyRegistry;
