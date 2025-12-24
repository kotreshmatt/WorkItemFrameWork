import { DomainError } from '../../../../packages/domain/common/DomainError';

class MyError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

describe('DomainError', () => {
  it('should instantiate custom domain error', () => {
    const err = new MyError('Test error');
    expect(err.message).toBe('Test error');
  });
});
