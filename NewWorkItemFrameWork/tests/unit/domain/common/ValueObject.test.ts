import { ValueObject } from '../../../../packages/domain/common/ValueObject';

class TestVO extends ValueObject<{ x: number }> {
  static create(props: { x: number }): TestVO {
    return new TestVO(props);
  }
}

describe('ValueObject', () => {
  it('should compare equality', () => {
    const vo1 = TestVO.create({ x: 1 });
    const vo2 = TestVO.create({ x: 1 });
    expect(vo1.equals(vo2)).toBe(true);
  });
});