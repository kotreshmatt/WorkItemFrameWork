import { IdempotencyValidator } from
  '../../../../../packages/domain/workitem/validation/IdempotencyValidator';
import { TestLogger } from '../../../../utils/TestLogger';

describe('IdempotencyValidator', () => {
  const validator = new IdempotencyValidator(TestLogger);

  it('allows first-time command', async () => {
    const result = await validator.validate(false);
    expect(result.valid).toBe(true);
  });

  it('rejects duplicate command', async () => {
    const result = await validator.validate(true);
    expect(result.valid).toBe(false);
  });
});
