import { WorkItemActionGateway } from
  '../../../../../packages/gateway/port/WorkItemActionGateway';

import { ClaimWorkItemCommand } from
  '../../../../../packages/domain/workitem/commands/ClaimWorkItemCommand';
import { CompleteWorkItemCommand } from
  '../../../../../packages/domain/workitem/commands/CompleteWorkItemCommand';
import { CancelWorkItemCommand } from
  '../../../../../packages/domain/workitem/commands/CancelWorkItemCommand';

import { WorkItemCommandResult } from
  '../../../../../packages/domain/workitem/results/WorkItemCommandResults';

import { WorkItemId } from
  '../../../../../packages/domain';

/**
 * Mock implementation to validate gateway contract only.
 * No domain behavior. No events. No persistence.
 */
class MockWorkItemActionGateway implements WorkItemActionGateway {

  claim = jest.fn(async (command: ClaimWorkItemCommand): Promise<WorkItemCommandResult> => ({
    workItemId: command.workItemId,
    success: true
  }));

  complete = jest.fn(async (command: CompleteWorkItemCommand): Promise<WorkItemCommandResult> => ({
    workItemId: command.workItemId,
    success: true
  }));

  cancel = jest.fn(async (command: CancelWorkItemCommand): Promise<WorkItemCommandResult> => ({
    workItemId: command.workItemId,
    success: true
  }));
}

describe('WorkItemActionGateway contract', () => {

  let gateway: WorkItemActionGateway;

  beforeEach(() => {
    gateway = new MockWorkItemActionGateway();
  });

  it('claim() should return successful WorkItemCommandResult', async () => {
    const command: ClaimWorkItemCommand = {
      workItemId: WorkItemId.of(1),
      initiatedBy: 'user1',
      initiatedAt: new Date()
    };

    const result = await gateway.claim(command);

    expect(result.success).toBe(true);
  });

  it('complete() should return successful WorkItemCommandResult', async () => {
    const command: CompleteWorkItemCommand = {
      workItemId: WorkItemId.of(1),
      initiatedBy: 'user1',
      initiatedAt: new Date(),
      output: { approved: true }
    };

    const result = await gateway.complete(command);

    expect(result.success).toBe(true);
  });

  it('cancel() should return successful WorkItemCommandResult', async () => {
    const command: CancelWorkItemCommand = {
      workItemId: WorkItemId.of(1),
      initiatedBy: 'user1',
      initiatedAt: new Date(),
      reason: 'User cancelled'
    };

    const result = await gateway.cancel(command);

    expect(result.success).toBe(true);
  });

  it('should forward claim command to gateway implementation', async () => {
    const mock = gateway as MockWorkItemActionGateway;

    const command: ClaimWorkItemCommand = {
      workItemId: WorkItemId.of(2),
      initiatedBy: 'user2',
      initiatedAt: new Date()
    };

    await gateway.claim(command);

    expect(mock.claim).toHaveBeenCalledWith(command);
  });

  it('should forward complete command to gateway implementation', async () => {
    const mock = gateway as MockWorkItemActionGateway;

    const command: CompleteWorkItemCommand = {
      workItemId: WorkItemId.of(3),
      initiatedBy: 'user3',
      initiatedAt: new Date(),
      output: {}
    };

    await gateway.complete(command);

    expect(mock.complete).toHaveBeenCalledWith(command);
  });

  it('should forward cancel command to gateway implementation', async () => {
    const mock = gateway as MockWorkItemActionGateway;

    const command: CancelWorkItemCommand = {
      workItemId: WorkItemId.of(4),
      initiatedBy: 'user4',
      initiatedAt: new Date(),
      reason: 'No longer required'
    };

    await gateway.cancel(command);

    expect(mock.cancel).toHaveBeenCalledWith(command);
  });
});
