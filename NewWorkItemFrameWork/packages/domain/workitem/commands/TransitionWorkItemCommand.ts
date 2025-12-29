import { WorkItemId } from '../WorkItemId';
import { WorkItemState } from '../WorkItemState';

export interface TransitionWorkItemCommand {

  /** Target work item */
  readonly workItemId: WorkItemId;

  /** Actor performing transition */
  readonly actorId: string;

  /** Desired target state */
  readonly targetState: WorkItemState;

  /** Optional input / output parameters */
  readonly parameters?: Record<string, unknown>;

  /** Idempotency key */
  readonly idempotencyKey?: string;

  /** Deterministic timestamp */
  readonly initiatedAt: Date;
}
