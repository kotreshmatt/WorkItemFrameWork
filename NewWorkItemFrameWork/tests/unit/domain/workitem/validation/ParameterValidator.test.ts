import { ParameterValidator } from
  '../../../../../packages/domain/workitem/validation/ParameterValidator';

describe('ParameterValidator', () => {
  const validator = new ParameterValidator();

  it('passes when all required params exist', async () => {
    const result = await validator.validateRequired(
      { approved: true },
      ['approved']
    );
    expect(result.valid).toBe(true);
  });

  it('fails when required param missing', async () => {
    const result = await validator.validateRequired(
      {},
      ['approved']
    );
    expect(result.valid).toBe(false);
  });

  it('passes when no required params defined', async () => {
    const result = await validator.validateRequired(
      {},
      []
    );
    expect(result.valid).toBe(true);
  });
});
