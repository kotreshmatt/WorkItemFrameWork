import { InvalidWorkItemTransitionError, UnauthorizedWorkItemActionError, InvalidWorkItemStateError } from '../../../../packages/domain/workitem/WorkItemErrors';
import { WorkItemState } from '../../../../packages/domain/workitem/WorkItemState';

describe('WorkItemErrors', () => {
  it('should throw InvalidWorkItemTransitionError', () => {
    const err = new InvalidWorkItemTransitionError(WorkItemState.NEW, WorkItemState.COMPLETED);
    expect(err).toBeInstanceOf(InvalidWorkItemTransitionError);
  });

  it('should throw UnauthorizedWorkItemActionError', () => {
    const err = new UnauthorizedWorkItemActionError('Claim');
    expect(err).toBeInstanceOf(UnauthorizedWorkItemActionError);
  });

  it('should throw InvalidWorkItemStateError', () => {
    const err = new InvalidWorkItemStateError(WorkItemState.NEW);
    expect(err).toBeInstanceOf(InvalidWorkItemStateError);
  });
});
