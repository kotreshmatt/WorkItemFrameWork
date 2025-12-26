import { StateTransitionValidator } from
  '../../../../../packages/domain/workitem/validation/StateTransitionValidator'; 
import { WorkItemState } from
  '../../../../../packages/domain/workitem/WorkItemState';

describe('StateTransitionValidator', () => {
  const validator = new StateTransitionValidator();

  it('allows valid transition', () => {
    const result = validator.validate(
      WorkItemState.ACTIVE,
      WorkItemState.CLAIMED
    );
    expect(result.valid).toBe(true);
  });

  it('rejects invalid transition', () => {
    const result = validator.validate(
      WorkItemState.NEW,
      WorkItemState.COMPLETED
    );
    expect(result.valid).toBe(false);
  });
});
