import { RoundRobinStrategy } from
  '../../../../../../packages/domain/workitem/distribution/strategies/RoundRobinStrategy';

describe('RoundRobinStrategy', () => {

  it('rotates after last assigned user', async () => {
    const strategy = new RoundRobinStrategy();

    const result = await strategy.resolve({
      eligibleUsers: ['u1', 'u2', 'u3'],
      historicalAssignments: ['u1']
    });

    expect(result.selectedUsers).toEqual(['u2']);
  });
});
