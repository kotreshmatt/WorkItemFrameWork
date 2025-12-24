import { WorkItem } from '../../../../packages/domain/workitem/WorkItem';
import { WorkItemState } from '../../../../packages/domain/workitem/WorkItemState';
import { WorkItemId } from '../../../../packages/domain/workitem/WorkItemId';
import { InvalidWorkItemTransitionError } from '../../../../packages/domain/workitem/WorkItemErrors';
import { WorkItemAssignmentSpec } from '../../../../packages/domain/workitem/WorkItemAssignmentSpec';
import { DistributionStrategyType, DistributionMode } from '../../../../packages/domain/workitem/WorkItemDistribution';

describe('WorkItem Domain Tests', () => {

  const assignmentSpec: WorkItemAssignmentSpec = {
    strategy: DistributionStrategyType.DEFAULT,
    mode: DistributionMode.PUSH
  };

  it('should initialize with NEW state', () => {
    const wi = new WorkItem(WorkItemId.of(1), 'TASK', 'wf1', 'run1', 'Approve', assignmentSpec);
    expect(wi.state).toBe(WorkItemState.NEW);
  });

  it('should activate work item', () => {
    const wi = new WorkItem(WorkItemId.of(2), 'TASK', 'wf2', 'run2', 'Review', assignmentSpec);
    wi.activate();
    expect(wi.state).toBe(WorkItemState.ACTIVE);
  });

  it('should claim work item from ACTIVE state', () => {
    const wi = new WorkItem(WorkItemId.of(3), 'TASK', 'wf3', 'run3', 'Approve', assignmentSpec, WorkItemState.ACTIVE);
    wi.claim('user1');
    expect(wi.state).toBe(WorkItemState.CLAIMED);
    expect(wi.assigneeId).toBe('user1');
  });

  it('should complete work item from CLAIMED state', () => {
    const wi = new WorkItem(WorkItemId.of(4), 'TASK', 'wf4', 'run4', 'Review', assignmentSpec, WorkItemState.CLAIMED);
    wi.complete({ approved: true });
    expect(wi.state).toBe(WorkItemState.COMPLETED);
  });

  it('should cancel work item from ACTIVE state', () => {
    const wi = new WorkItem(WorkItemId.of(5), 'TASK', 'wf5', 'run5', 'Review', assignmentSpec, WorkItemState.ACTIVE);
    wi.cancel();
    expect(wi.state).toBe(WorkItemState.CANCELLED);
  });

  it('should throw error for invalid transitions', () => {
    const wi = new WorkItem(WorkItemId.of(6), 'TASK', 'wf6', 'run6', 'Review', assignmentSpec);
    expect(() => wi.complete({})).toThrow(InvalidWorkItemTransitionError);
  });

});
