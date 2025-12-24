import { DistributionStrategyType, DistributionMode } from '../../../../packages/domain/workitem/WorkItemDistribution';

describe('WorkItemDistribution', () => {
  it('should include all strategies', () => {
    expect(Object.values(DistributionStrategyType)).toContain('DEFAULT');
    expect(Object.values(DistributionStrategyType)).toContain('RANDOM');
  });

  it('should include all modes', () => {
    expect(Object.values(DistributionMode)).toContain('PUSH');
    expect(Object.values(DistributionMode)).toContain('PULL');
  });
});
