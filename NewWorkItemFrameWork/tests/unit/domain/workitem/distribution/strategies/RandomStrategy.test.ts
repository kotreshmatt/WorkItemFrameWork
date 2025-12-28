import { RandomStrategy } from
  '../../../../../../packages/domain/workitem/distribution/strategies/RandomStrategy';

describe('RandomStrategy', () => {

  it('selects deterministic user based on seed', async () => {
    const strategy = new RandomStrategy();

    const result = await strategy.resolve({
      eligibleUsers: ['u1', 'u2', 'u3'],
      config: { seed: 2 }
    });

    expect(result.selectedUsers).toEqual(['u3']);
  });
});
