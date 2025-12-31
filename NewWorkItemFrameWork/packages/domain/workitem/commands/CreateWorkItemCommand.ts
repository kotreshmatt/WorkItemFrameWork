// packages/domain/workitem/commands/CreateWorkItemCommand.ts

import { WorkItemId } from '../WorkItemId';
import { WorkItemAssignmentSpec } from '../WorkItemAssignmentSpec';
import {
  DistributionStrategyType,
  DistributionMode
} from '../WorkItemDistribution';

export interface CreateWorkItemCommand {

  /** Deterministic ID from orchestrator */
  //readonly workItemId: WorkItemId;

  /** Workflow correlation */
  readonly workflowId: string;
  readonly runId: string;

  /** Task metadata */
  readonly taskType: string;
  readonly taskName: string;
  readonly description?: string;
  readonly priority?: number;

  /** Assignment */
  readonly assignmentSpec: WorkItemAssignmentSpec;

  /** Distribution (optional → defaults applied) */
  readonly distributionStrategy?: DistributionStrategyType;
  readonly distributionMode?: DistributionMode;

  /** Context */
  readonly contextData?: Record<string, unknown>;

  /** Parameters */
  readonly parameters?: Array<{
    name: string;
    direction: 'IN' | 'OUT' | 'INOUT';
    mandatory?: boolean;
    value?: unknown;
  }>;

  /** SLA */
  readonly dueDate?: Date | null;

  /** Lifecycle */
  readonly lifecycle: string;

  /** Actor */
  readonly initiatedBy: string;
  readonly initiatedAt: Date;
}
