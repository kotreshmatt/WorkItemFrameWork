import { LifecycleEngine } from
  '../../../../../packages/domain/workitem/Lifecycle/LifecycleEngine';
import { WorkItemState } from
  '../../../../../packages/domain/workitem/WorkItemState';
import { TransitionResolver } from
  '../../../../../packages/domain/workitem/Lifecycle/TransitionResolver';

  const resolver: TransitionResolver = {
    isAllowed: jest.fn((from, to) => {
      if (from === WorkItemState.ACTIVE && to === WorkItemState.CLAIMED) {
        return true;
      }
      return false;
    })
  };
  
  describe('LifecycleEngine', () => {
    let engine: LifecycleEngine;
  
    beforeEach(() => {
      engine = new LifecycleEngine(resolver);
    });
  
    it('allows valid transition', () => {
      expect(() =>
        engine.assertTransition(
          WorkItemState.ACTIVE,
          WorkItemState.CLAIMED
        )
      ).not.toThrow();
    });
  
    it('rejects invalid transition', () => {
      expect(() =>
        engine.assertTransition(
          WorkItemState.NEW,
          WorkItemState.COMPLETED
        )
      ).toThrow();
    });
  });