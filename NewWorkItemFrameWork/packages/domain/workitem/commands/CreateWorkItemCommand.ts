import { WorkItemId } from '../WorkItemId';
import { WorkItemAssignmentSpec } from '../WorkItemAssignmentSpec';

export interface CreateWorkItemCommand {

  /** Deterministic ID from orchestrator */
  readonly workItemId: WorkItemId;

  /** Workflow / process correlation */
  readonly workflowId: string;
  readonly runId: string;

  /** Task metadata */
  readonly type: string;
  readonly taskName: string;

  /** Assignment rules */
  readonly assignmentSpec: WorkItemAssignmentSpec;

  /** Initial input parameters */
  readonly parameters?: Record<string, unknown>;

  /** Lifecycle to apply */
  readonly lifecycle: string;

  /** Who initiated creation (system / orchestrator) */
  readonly initiatedBy: string;

  /** Deterministic timestamp */
  readonly initiatedAt: Date;
}
