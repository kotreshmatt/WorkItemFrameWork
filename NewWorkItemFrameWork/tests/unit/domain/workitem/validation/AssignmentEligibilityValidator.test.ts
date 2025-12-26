import { AssignmentEligibilityValidator } from
  '../../../../../packages/domain/workitem/validation/AssignmentEligibilityValidator';
import { DistributionStrategyType, DistributionMode } from
  '../../../../../packages/domain/workitem/WorkItemDistribution';

describe('AssignmentEligibilityValidator', () => {
  const validator = new AssignmentEligibilityValidator();

  it('allows eligible candidate user', () => {
    const result = validator.validate('user1', {
      candidateUsers: ['user1'],
      strategy: DistributionStrategyType.DEFAULT,
      mode: DistributionMode.PUSH
    });
    expect(result.valid).toBe(true);
  });

  it('rejects non-eligible user', () => {
    const result = validator.validate('user2', {
      candidateUsers: ['user1'],
      strategy: DistributionStrategyType.DEFAULT,
      mode: DistributionMode.PUSH
    });
    expect(result.valid).toBe(false);
  });

  it('allows when no explicit candidates defined', () => {
    const result = validator.validate('user1', {
      strategy: DistributionStrategyType.DEFAULT,
      mode: DistributionMode.PUSH
    });
    expect(result.valid).toBe(true);
  });
});
