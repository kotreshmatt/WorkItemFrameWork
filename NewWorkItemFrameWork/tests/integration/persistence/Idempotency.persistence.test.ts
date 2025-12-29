import { unitOfWork } from './testDb';
import { JdbcIdempotencyRepository } from '../../../packages/persistence/repository/JdbcIdempotencyRepositroy';

describe('Idempotency enforcement', () => {

  it('returns same result for duplicate key', async () => {
    const uow = unitOfWork();
    const repo = new JdbcIdempotencyRepository();

    const key = 'CLAIM:42:user1';

    const first = await uow.withTransaction(tx =>
      repo.record(tx, key, {
        workItemId: 42,
        action: 'CLAIM',
        result: { success: true }
      })
    );

    const second = await uow.withTransaction(tx =>
      repo.record(tx, key, {
        workItemId: 42,
        action: 'CLAIM',
        result: { success: true }
      })
    );

    expect(second).toEqual(first);
  });
});
