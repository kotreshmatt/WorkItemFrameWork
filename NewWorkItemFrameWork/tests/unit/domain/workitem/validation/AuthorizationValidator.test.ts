import { AuthorizationValidator } from
  '../../../../../packages/domain/workitem/validation/AuthorizationValidator';

describe('AuthorizationValidator', () => {
  const validator = new AuthorizationValidator();

  it('allows assignee to act', () => {
    const result = validator.validate('user1', 'user1');
    expect(result.valid).toBe(true);
  });

  it('rejects non-assignee', () => {
    const result = validator.validate('user2', 'user1');
    expect(result.valid).toBe(false);
  });

  it('allows action when no assignee exists', () => {
    const result = validator.validate('user1', undefined);
    expect(result.valid).toBe(true);
  });
});
