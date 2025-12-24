import { Identifier } from '../../../../packages/domain/common/Identifier';

class TestId extends Identifier<number> {
  get(): any {
      throw new Error('Method not implemented.');
  }
  constructor(value: number) {
    super(value);
  }
}

describe('Identifier', () => {
  it('should create identifier', () => {
    const id = new TestId(10);
    expect(id.get()).toBe(10);
  });
});
