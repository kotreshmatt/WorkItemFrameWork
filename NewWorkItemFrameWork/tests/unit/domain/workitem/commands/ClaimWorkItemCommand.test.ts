import { ClaimWorkItemCommand } from '../../../../../packages/domain/workitem/commands/ClaimWorkItemCommand';
import { WorkItemId } from '../../../../../packages/domain/workitem/WorkItemId';

describe('ClaimWorkItemCommand', () => {
  it('should instantiate with WorkItemId and userId', () => {
    const cmd: ClaimWorkItemCommand = {
      workItemId: WorkItemId.of(1),
      initiatedBy: 'user1',
      initiatedAt: new Date()
    };
    expect(cmd.workItemId.get()).toBe(1);
    expect(cmd.initiatedAt).toBe('user1');
  });
});
