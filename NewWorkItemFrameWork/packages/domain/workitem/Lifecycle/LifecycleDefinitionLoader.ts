import { LifecycleDefinition } from './LifeCycleDefinition';
import { WorkItemState } from '../WorkItemState';

export class LifecycleDefinitionLoader {

  private readonly lifecycles = new Map<string, LifecycleDefinition>([
    ['default', {
      name: 'default',
      initialState: WorkItemState.OFFERED,
      transitions: {
        NEW: [WorkItemState.OFFERED],
        OFFERED: [WorkItemState.CLAIMED, WorkItemState.CANCELLED],
        CLAIMED: [WorkItemState.COMPLETED, WorkItemState.CANCELLED],
        COMPLETED: [],
        CANCELLED: []
      }
    }]
  ]);

  load(name: string): LifecycleDefinition {
    const lifecycle = this.lifecycles.get(name);
    if (!lifecycle) {
      throw new Error(`Lifecycle '${name}' not found`);
    }
    return lifecycle;
  }
}
