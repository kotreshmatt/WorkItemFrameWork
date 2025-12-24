import { WorkItemId } from './WorkItemId';
import { WorkItemState } from './WorkItemState';
import { AllowedTransitions } from './WorkItemLifecycle';
import { WorkItemAssignmentSpec } from './WorkItemAssignmentSpec';
import { InvalidWorkItemTransitionError } from './WorkItemErrors';

export class WorkItem {
  private _state: WorkItemState;
  private _assigneeId?: string;
  private _context: Record<string, any>;

  constructor(
    readonly id: WorkItemId,
    readonly type: string,
    readonly workflowId: string,
    readonly runId: string,
    readonly taskName: string,
    readonly assignmentSpec: WorkItemAssignmentSpec,
    initialState: WorkItemState = WorkItemState.NEW,
    context: Record<string, any> = {}
  ) {
    this._state = initialState;
    this._context = context;
  }

  get state(): WorkItemState {
    return this._state;
  }

  get assigneeId(): string | undefined {
    return this._assigneeId;
  }

  activate(): void {
    this.transitionTo(WorkItemState.ACTIVE);
  }

  claim(userId: string): void {
    this.transitionTo(WorkItemState.CLAIMED);
    this._assigneeId = userId;
  }

  complete(output: Record<string, any>): void {
    this.transitionTo(WorkItemState.COMPLETED);
    this._context = { ...this._context, ...output };
  }

  cancel(): void {
    this.transitionTo(WorkItemState.CANCELLED);
  }

  private transitionTo(target: WorkItemState): void {
    if (!AllowedTransitions[this._state].includes(target)) {
        throw new InvalidWorkItemTransitionError(this._state, target);
    }
    this._state = target;
  }
}
