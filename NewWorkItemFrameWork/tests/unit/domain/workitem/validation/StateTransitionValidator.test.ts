import { StateTransitionValidator } from
  '../../../../../packages/domain/workitem/validation/StateTransitionValidator'; 
import { WorkItemState } from
  '../../../../../packages/domain/workitem/WorkItemState';

describe('StateTransitionValidator', () => {
  const validator = new StateTransitionValidator();

  it('allows valid transition', async () => {
    const result = await validator.validate(
      WorkItemState.ACTIVE,
      WorkItemState.CLAIMED
    );
    expect(result.valid).toBe(true);
  });

  it('rejects invalid transition', async () => {
    const result = await validator.validate(
      WorkItemState.NEW,
      WorkItemState.COMPLETED
    );
    expect(result.valid).toBe(false);
  });
});
