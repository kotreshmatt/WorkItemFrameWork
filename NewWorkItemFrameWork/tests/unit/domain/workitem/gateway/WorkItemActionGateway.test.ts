import { WorkItemActionGateway } from '../../../../../packages/gateway/port/WorkItemActionGateway';
import { ClaimWorkItemCommand } from '../../../../../packages/domain/workitem/commands/ClaimWorkItemCommand';
import { CompleteWorkItemCommand } from '../../../../../packages/domain/workitem/commands/CompleteWorkItemCommand';
import { CancelWorkItemCommand } from '../../../../../packages/domain/workitem/commands/CancelWorkItemCommand';
import { WorkItemCommandResult } from '../../../../../packages/domain/workitem/results/WorkItemCommandResults';

// Mock implementation to test contract only
class MockWorkItemActionGateway implements WorkItemActionGateway {
  claim = jest.fn(async (_: ClaimWorkItemCommand) => new WorkItemCommandResult(true));
  complete = jest.fn(async (_: CompleteWorkItemCommand) => new WorkItemCommandResult(true));
  cancel = jest.fn(async (_: CancelWorkItemCommand) => new WorkItemCommandResult(true));
}

describe('WorkItemActionGateway contract', () => {
  let gateway: WorkItemActionGateway;

  beforeEach(() => {
    gateway = new MockWorkItemActionGateway();
  });

  it('should have claim method returning WorkItemCommandResult', async () => {
    const result = await gateway.claim(new ClaimWorkItemCommand(1, 'user1'));
    expect(result).toBeInstanceOf(WorkItemCommandResult);
  });

  it('should have complete method returning WorkItemCommandResult', async () => {
    const result = await gateway.complete(new CompleteWorkItemCommand(1, {}));
    expect(result).toBeInstanceOf(WorkItemCommandResult);
  });

  it('should have cancel method returning WorkItemCommandResult', async () => {
    const result = await gateway.cancel(new CancelWorkItemCommand(1));
    expect(result).toBeInstanceOf(WorkItemCommandResult);
  });

  it('should call claim with correct command', async () => {
    const mock = gateway as MockWorkItemActionGateway;
    const command = new ClaimWorkItemCommand(1, 'user1');
    await gateway.claim(command);
    expect(mock.claim).toHaveBeenCalledWith(command);
  });

  it('should call complete with correct command', async () => {
    const mock = gateway as MockWorkItemActionGateway;
    const command = new CompleteWorkItemCommand(1, { approved: true });
    await gateway.complete(command);
    expect(mock.complete).toHaveBeenCalledWith(command);
  });

  it('should call cancel with correct command', async () => {
    const mock = gateway as MockWorkItemActionGateway;
    const command = new CancelWorkItemCommand(1);
    await gateway.cancel(command);
    expect(mock.cancel).toHaveBeenCalledWith(command);
  });
});
