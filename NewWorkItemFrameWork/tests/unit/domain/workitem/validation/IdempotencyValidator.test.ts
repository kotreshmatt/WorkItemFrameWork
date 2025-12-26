import { IdempotencyValidator } from
  '../../../../../packages/domain/workitem/validation/IdempotencyValidator';

describe('IdempotencyValidator', () => {
  const validator = new IdempotencyValidator();

  it('allows first-time command', () => {
    const result = validator.validate(false);
    expect(result.valid).toBe(true);
  });

  it('rejects duplicate command', () => {
    const result = validator.validate(true);
    expect(result.valid).toBe(false);
  });
});
