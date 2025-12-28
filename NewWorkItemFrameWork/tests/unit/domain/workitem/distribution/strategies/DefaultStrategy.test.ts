import { DefaultStrategy } from
  '../../../../../../packages/domain/workitem/distribution/strategies/DeafualtStrategy';

describe('DefaultStrategy', () => {

  it('selects first eligible user', async () => {
    const strategy = new DefaultStrategy();

    const result = await strategy.resolve({
      eligibleUsers: ['u1', 'u2']
    });

    expect(result.selectedUsers).toEqual(['u1']);
  });

  it('returns empty when no users', async () => {
    const strategy = new DefaultStrategy();

    const result = await strategy.resolve({
      eligibleUsers: []
    });

    expect(result.selectedUsers).toEqual([]);
  });
});
