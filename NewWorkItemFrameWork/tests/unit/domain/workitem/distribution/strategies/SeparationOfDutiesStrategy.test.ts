import { SeparationOfDutiesStrategy } from
  '../../../../../../packages/domain/workitem/distribution/strategies/SeparationOfDutiesStrategy';

describe('SeparationOfDutiesStrategy', () => {

  it('excludes previously assigned users', async () => {
    const strategy = new SeparationOfDutiesStrategy();

    const result = await strategy.resolve({
      eligibleUsers: ['u1', 'u2'],
      historicalAssignments: ['u1']
    });

    expect(result.selectedUsers).toEqual(['u2']);
  });
});
