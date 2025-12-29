import { WorkItemState } from '../WorkItemState';

export interface LifecycleDefinition {
  readonly name: string;
  readonly initialState: WorkItemState;
  readonly transitions: Record<WorkItemState, WorkItemState[]>;
}
