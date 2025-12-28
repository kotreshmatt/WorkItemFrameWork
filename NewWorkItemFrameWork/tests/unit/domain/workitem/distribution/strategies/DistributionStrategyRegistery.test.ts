import { DistributionStrategyRegistry } from
  '../../../../../../packages/domain/workitem/distribution/strategies/DistributionStrategyRegistry';
import { DefaultStrategy } from
  '../../../../../../packages/domain/workitem/distribution/strategies/DeafualtStrategy';
import { DistributionStrategyType } from
  '../../../../../../packages/domain/workitem/WorkItemDistribution';

describe('DistributionStrategyRegistry', () => {

  it('returns registered strategy', () => {
    const registry = new DistributionStrategyRegistry();
    registry.register(new DefaultStrategy());

    const strategy = registry.get(
      DistributionStrategyType.DEFAULT,
      [DistributionStrategyType.DEFAULT],
      DistributionStrategyType.DEFAULT
    );

    expect(strategy).toBeInstanceOf(DefaultStrategy);
  });

  it('falls back when strategy disabled', () => {
    const registry = new DistributionStrategyRegistry();
    registry.register(new DefaultStrategy());

    const strategy = registry.get(
      DistributionStrategyType.ROUND_ROBIN,
      [],
      DistributionStrategyType.DEFAULT
    );

    expect(strategy).toBeInstanceOf(DefaultStrategy);
  });
});
