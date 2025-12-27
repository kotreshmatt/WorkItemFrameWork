import { WorkItemCommandValidationService } from
  '../../../../../packages/domain/workitem/validation-orchestrator/WorkItemCommandValidationService';
import { WorkItemState } from '../../../../../packages/domain/workitem/WorkItemState';
import { WorkItem } from '../../../../../packages/domain/workitem/WorkItem';
import { DistributionStrategyType, DistributionMode } from '../../../../../packages/domain/workitem/WorkItemDistribution';

import { 
    StateTransitionValidator, 
    AuthorizationValidator, 
    AssignmentEligibilityValidator, 
    ParameterValidator, 
    LifecycleValidator, 
    IdempotencyValidator 
  } from '../../../../../packages/domain/workitem/validation/index';
import { InMemoryOrgModelRepository } from '../../../../../packages/domain/Repository/InMemoryOrgModelrespository';

describe('WorkItemCommandValidationService', () => {

  const service = new WorkItemCommandValidationService(
    new StateTransitionValidator(),
    new AuthorizationValidator(),
    new AssignmentEligibilityValidator(new InMemoryOrgModelRepository(
      // OrgUnits
      {
        OU1: { id: 'OU1', name: 'Finance' }
      },
      // Positions by OrgUnit
      {
        OU1: [{ id: 'P1', name: 'Manager', orgUnitId: 'user1' }]
      },
      // Groups by User
      {
        user1: [{ id: 'G1', name: 'Managers' }]
      }
    )),
    new ParameterValidator(),
    new LifecycleValidator(),
    new IdempotencyValidator()
  );

  it('should pass validation for valid claim', async () => {
    const wi = new WorkItem(
      { get: () => 1 } as any,
      'TASK',
      'wf1',
      'run1',
      'Approve',
      {
        strategy: DistributionStrategyType.DEFAULT,
        mode: DistributionMode.PUSH,
        candidateUsers: ['user1']
      },
      WorkItemState.ACTIVE
    );

    const result = await service.validate({
      workItem: wi,
      actorId: 'user1',
      targetState: WorkItemState.CLAIMED
    });

    expect(result.valid).toBe(true);
  });

  it('should fail on invalid transition', async () => {
    const wi = new WorkItem(
      { get: () => 1 } as any,
      'TASK',
      'wf1',
      'run1',
      'Approve',
      {
        strategy: DistributionStrategyType.DEFAULT,
        mode: DistributionMode.PUSH
      },
      WorkItemState.NEW
    );

    const result = await service.validate({
      workItem: wi,
      actorId: 'user1',
      targetState: WorkItemState.COMPLETED
    });

    expect(result.valid).toBe(false);
  });

  it('should fail on unauthorized actor', async () => {
    const wi = new WorkItem(
      { get: () => 1 } as any,
      'TASK',
      'wf1',
      'run1',
      'Approve',
      {
        strategy: DistributionStrategyType.DEFAULT,
        mode: DistributionMode.PUSH
      },
      WorkItemState.CLAIMED
    );

    (wi as any)._assigneeId = 'user1';

    const result = await service.validate({
      workItem: wi,
      actorId: 'user2',
      targetState: WorkItemState.COMPLETED
    });

    expect(result.valid).toBe(false);
  });
});
