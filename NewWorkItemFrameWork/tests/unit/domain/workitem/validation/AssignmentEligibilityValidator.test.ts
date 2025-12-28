import { AssignmentEligibilityValidator } from
  '../../../../../packages/domain/workitem/validation/AssignmentEligibilityValidator';
import { InMemoryOrgModelRepository } from
  '../../../../../packages/domain/Repository/InMemoryOrgModelrespository';
import { WorkItem } from
  '../../../../../packages/domain/workitem/WorkItem';
import { WorkItemState } from
  '../../../../../packages/domain/workitem/WorkItemState';
import { DistributionStrategyType, DistributionMode } from
  '../../../../../packages/domain/workitem/WorkItemDistribution';
import { WorkItemId } from
  '../../../../../packages/domain/workitem/WorkItemId';
import { OrgUnit } from
  '../../../../../packages/domain/orgmodel/OrgUnit';
import { Position } from
  '../../../../../packages/domain/orgmodel/Position';
import { Group } from
  '../../../../../packages/domain/orgmodel/Group';
import { TestLogger } from '../../../../utils/TestLogger';

describe('AssignmentEligibilityValidator', () => {

  const orgRepo = new InMemoryOrgModelRepository(
    // OrgUnits
    {
      OU1: { id: 'OU1', name: 'Finance' }
    },
    // Positions by OrgUnit
    {
      OU1: [{id: 'P1',name: 'Manager',orgUnitId: 'user1'} ]
    },
    // Groups by User
    {
      user1: [{ id: 'G1', name: 'Managers' }]
    }
  );

  const validator = new AssignmentEligibilityValidator(orgRepo,TestLogger);

  it('allows eligible candidate user (direct user match)', async () => {
    const wi = new WorkItem(
      WorkItemId.of(1),
      'TASK',
      'wf1',
      'run1',
      'Approve',
      {
        candidateUsers: ['user1'],
        strategy: DistributionStrategyType.DEFAULT,
        mode: DistributionMode.PUSH
      },
      WorkItemState.ACTIVE
    );

    const result = await validator.validate(wi, 'user1');
    expect(result.valid).toBe(true);
  });

  it('rejects non-eligible user', async () => {
    const wi = new WorkItem(
      WorkItemId.of(2),
      'TASK',
      'wf1',
      'run1',
      'Approve',
      {
        candidateUsers: ['user1'],
        strategy: DistributionStrategyType.DEFAULT,
        mode: DistributionMode.PUSH
      },
      WorkItemState.ACTIVE
    );

    const result = await validator.validate(wi, 'user2');
    expect(result.valid).toBe(false);
  });

  it('allows when no explicit candidates defined', async () => {
    const wi = new WorkItem(
      WorkItemId.of(3),
      'TASK',
      'wf1',
      'run1',
      'Approve',
      {
        strategy: DistributionStrategyType.DEFAULT,
        mode: DistributionMode.PUSH
      },
      WorkItemState.ACTIVE
    );

    const result = await validator.validate(wi, 'anyUser');
    expect(result.valid).toBe(true);
  });

  it('allows user via group membership', async () => {
    const wi = new WorkItem(
      WorkItemId.of(4),
      'TASK',
      'wf1',
      'run1',
      'Approve',
      {
        candidateGroups: ['G1'],
        strategy: DistributionStrategyType.DEFAULT,
        mode: DistributionMode.PUSH
      },
      WorkItemState.ACTIVE
    );

    const result = await validator.validate(wi, 'user1');
    expect(result.valid).toBe(true);
  });

  it('allows user via org unit position', async () => {
    const wi = new WorkItem(
      WorkItemId.of(5),
      'TASK',
      'wf1',
      'run1',
      'Approve',
      {
        candidateOrgUnits: ['OU1'],
        strategy: DistributionStrategyType.DEFAULT,
        mode: DistributionMode.PUSH
      },
      WorkItemState.ACTIVE
    );

    const result = await validator.validate(wi, 'user1');
    expect(result.valid).toBe(true);
  });
});
