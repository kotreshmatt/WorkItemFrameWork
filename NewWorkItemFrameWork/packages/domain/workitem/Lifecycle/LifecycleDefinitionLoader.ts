import { WorkItemState } from '../WorkItemState';

export class LifecycleDefinitionLoader {

  load(): WorkItemState[] {
    return Object.values(WorkItemState);
  }
}
