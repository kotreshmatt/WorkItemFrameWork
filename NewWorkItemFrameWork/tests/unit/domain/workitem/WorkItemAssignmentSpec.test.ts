import { WorkItemAssignmentSpec } from '../../../../packages/domain/workitem/WorkItemAssignmentSpec';
import { DistributionStrategyType, DistributionMode } from '../../../../packages/domain/workitem/WorkItemDistribution';

describe('WorkItemAssignmentSpec', () => {
  it('should create assignment spec correctly', () => {
    const spec: WorkItemAssignmentSpec = {
      candidateUsers: ['user1', 'user2'],
      candidateGroups: ['group1'],
      candidateOrgUnits: ['org1'],
      strategy: DistributionStrategyType.ROUND_ROBIN,
      mode: DistributionMode.PUSH
    };

    expect(spec.candidateUsers).toContain('user1');
    expect(spec.strategy).toBe(DistributionStrategyType.ROUND_ROBIN);
    expect(spec.mode).toBe(DistributionMode.PUSH);
  });
});
