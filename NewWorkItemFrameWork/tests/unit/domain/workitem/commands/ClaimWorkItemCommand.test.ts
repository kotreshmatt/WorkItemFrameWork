import { ClaimWorkItemCommand } from '../../../../../packages/domain/workitem/commands/ClaimWorkItemCommand';
import { WorkItemId } from '../../../../../packages/domain/workitem/WorkItemId';

describe('ClaimWorkItemCommand', () => {
  it('should instantiate with WorkItemId and userId', () => {
    const cmd = new ClaimWorkItemCommand(WorkItemId.of(1), 'user1');
    expect(cmd.workItemId.get()).toBe(1);
    expect(cmd.userId).toBe('user1');
  });
});
