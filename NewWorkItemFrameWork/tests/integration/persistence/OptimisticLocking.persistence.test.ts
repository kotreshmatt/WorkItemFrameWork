import { unitOfWork } from './testDb';
import { JdbcWorkItemRepository } from '../../../packages/persistence/repository/JdbcWorkItemRepository';
import { ConcurrentModificationError } from '../../../packages/persistence/errors/persistenceError';

describe('Optimistic locking', () => {

  it('allows only one concurrent state transition', async () => {
    const uow = unitOfWork();
    const repo = new JdbcWorkItemRepository(uow.getLogger());

    let id!: number;

    await uow.withTransaction(async tx => {
      id = await repo.insert(tx, {
        workflowId: 'WF3',
        state: 'ACTIVE',
        runId: 'run-3'
      });
    });

    const tx1 = uow.withTransaction(tx =>
      repo.transitionState(tx, {
        id,
        expectedVersion: 1,
        toState: 'CLAIMED',
        actorId: 'user1'
      })
    );

    const tx2 = uow.withTransaction(tx =>
      repo.transitionState(tx, {
        id,
        expectedVersion: 1,
        toState: 'CLAIMED',
        actorId: 'user2'
      })
    );

    const results = await Promise.allSettled([tx1, tx2]);

    const failures = results.filter(r => r.status === 'rejected');
    expect(failures.length).toBe(1);
    expect(failures[0]?.reason).toBeInstanceOf(
      ConcurrentModificationError
    );
  });
});
