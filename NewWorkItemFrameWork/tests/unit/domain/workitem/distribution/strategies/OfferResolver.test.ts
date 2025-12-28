import { OfferResolver } from
  '../../../../../../packages/domain/workitem/distribution/OfferResolver';
import { DistributionMode } from
  '../../../../../../packages/domain/workitem/WorkItemDistribution';

describe('OfferResolver', () => {

  const resolver = new OfferResolver();

  it('assigns immediately in PUSH mode', () => {
    const result = resolver.resolve(['u1', 'u2'], DistributionMode.PUSH);

    expect(result.assignedTo).toBe('u1');
    expect(result.offeredTo).toEqual([]);
  });

  it('offers all users in PULL mode', () => {
    const result = resolver.resolve(['u1', 'u2'], DistributionMode.PULL);

    expect(result.offeredTo).toEqual(['u1', 'u2']);
    expect(result.assignedTo).toBeUndefined();
  });
});
