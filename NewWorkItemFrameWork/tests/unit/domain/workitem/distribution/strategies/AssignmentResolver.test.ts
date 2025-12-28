import { AssignmentResolver } from
  '../../../../../../packages/domain/workitem/assignment/AssignmentResolver';
import { DistributionStrategyRegistry } from
  '../../../../../../packages/domain/workitem/distribution/strategies/DistributionStrategyRegistry';
import { DefaultStrategy } from
  '../../../../../../packages/domain/workitem/distribution/strategies/DeafualtStrategy';
import { OfferResolver } from
  '../../../../../../packages/domain/workitem/distribution/OfferResolver';
import { DistributionMode, DistributionStrategyType } from
  '../../../../../../packages/domain/workitem/WorkItemDistribution';

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

describe('AssignmentResolver', () => {

  it('resolves assignment end-to-end', async () => {

    const registry = new DistributionStrategyRegistry();
    registry.register(new DefaultStrategy());

    const resolver = new AssignmentResolver(
      registry,
      new OfferResolver(),
      logger as any
    );

    const result = await resolver.resolve({
      strategy: DistributionStrategyType.DEFAULT,
      mode: DistributionMode.PUSH,
      distributionContext: {
        eligibleUsers: ['u1', 'u2']
      }
    });

    expect(result.assignedTo).toBe('u1');
  });
});
