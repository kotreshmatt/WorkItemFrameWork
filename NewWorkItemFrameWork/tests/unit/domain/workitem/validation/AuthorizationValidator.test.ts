import { AuthorizationValidator } from
  '../../../../../packages/domain/workitem/validation/AuthorizationValidator';
import { TestLogger } from '../../../../utils/TestLogger';

describe('AuthorizationValidator', () => {
  const validator = new AuthorizationValidator(TestLogger);

  it('allows assignee to act', async () => {
    const result = validator.validate('user1', 'user1');
    expect((await result).valid).toBe(true);
  });

  it('rejects non-assignee', async () => {
    const result = await validator.validate('user2', 'user1');
    expect(result.valid).toBe(false);
  });

  it('allows action when no assignee exists', async () => {
    const result = await validator.validate('user1', undefined);
    expect(result.valid).toBe(true);
  });
});
