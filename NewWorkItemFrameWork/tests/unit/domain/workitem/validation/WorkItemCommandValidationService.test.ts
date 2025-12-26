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

describe('WorkItemCommandValidationService', () => {

  const service = new WorkItemCommandValidationService(
    new StateTransitionValidator(),
    new AuthorizationValidator(),
    new AssignmentEligibilityValidator(),
    new ParameterValidator(),
    new LifecycleValidator(),
    new IdempotencyValidator()
  );

  it('should pass validation for valid claim', () => {
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

    const result = service.validate({
      workItem: wi,
      actorId: 'user1',
      targetState: WorkItemState.CLAIMED
    });

    expect(result.valid).toBe(true);
  });

  it('should fail on invalid transition', () => {
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

    const result = service.validate({
      workItem: wi,
      actorId: 'user1',
      targetState: WorkItemState.COMPLETED
    });

    expect(result.valid).toBe(false);
  });

  it('should fail on unauthorized actor', () => {
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

    const result = service.validate({
      workItem: wi,
      actorId: 'user2',
      targetState: WorkItemState.COMPLETED
    });

    expect(result.valid).toBe(false);
  });
});
