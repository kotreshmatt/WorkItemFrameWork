import { WorkItemId, InvalidWorkItemIdError } from '../../../../packages/domain/workitem/WorkItemId';

describe('WorkItemId Value Object', () => {
  it('should create valid WorkItemId', () => {
    const id = WorkItemId.of(1);
    expect(id.get()).toBe(1);
  });

  it('should throw error for invalid WorkItemId', () => {
    expect(() => WorkItemId.of(0)).toThrow();
    expect(() => WorkItemId.of(-5)).toThrow();
    expect(() => WorkItemId.of(1.5)).toThrow();
  });

  it('should compare WorkItemIds', () => {
    const id1 = WorkItemId.of(1);
    const id2 = WorkItemId.of(2);
    const id3 = WorkItemId.of(1);
    expect(id1.equals(id2)).toBe(false);
    expect(id1.equals(id3)).toBe(true);
  });

});
