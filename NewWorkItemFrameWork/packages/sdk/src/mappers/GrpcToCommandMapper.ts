import { CreateWorkItemCommand } from '../../../domain/workitem/commands/CreateWorkItemCommand';
import { TransitionWorkItemCommand } from '../../../domain/workitem/commands/TransitionWorkItemCommand';
import { WorkItemState } from '../../../domain/workitem/WorkItemState';
import { WorkItemAssignmentSpec } from '../../../domain/workitem/WorkItemAssignmentSpec';
import { DistributionStrategyType, DistributionMode } from '../../../domain/workitem/WorkItemDistribution';

/**
 * GrpcToCommandMapper
 * Maps gRPC request types to internal Domain Command types
 */
export class GrpcToCommandMapper {

    static toCreateCommand(req: any): CreateWorkItemCommand {
        return {
            workflowId: req.workflow_id,
            runId: req.run_id || '',
            taskType: req.task_type || 'USER_TASK',
            taskName: req.task_name,
            description: req.description,
            priority: req.priority,
            lifecycle: req.lifecycle || 'default',
            initiatedBy: req.initiated_by || req.context?.actor_id || 'system',
            initiatedAt: req.initiated_at ? new Date(req.initiated_at) : new Date(),

            assignmentSpec: {
                strategy: req.assignment_spec?.strategy || req.distribution_strategy as DistributionStrategyType || 'OFFER_TO_ALL',
                mode: req.assignment_spec?.mode || req.distribution_mode as DistributionMode || 'PULL',
                candidateUsers: req.assignment_spec?.candidate_users || [],
                candidateGroups: req.assignment_spec?.candidate_groups || [],
                candidatePositions: req.assignment_spec?.candidate_positions || [],
                candidateOrgUnits: req.assignment_spec?.candidate_org_units || [],
                separationOfDutiesKey: req.assignment_spec?.separation_of_duties_key
            } as WorkItemAssignmentSpec,

            distributionStrategy: req.distribution_strategy as DistributionStrategyType,
            distributionMode: req.distribution_mode as DistributionMode,

            parameters: req.parameters || [],
            contextData: req.context_data ? GrpcToCommandMapper.safeParseJson(req.context_data) : {},
            dueDate: req.due_date ? new Date(req.due_date) : null
        };
    }

    static toTransitionCommand(
        targetState: WorkItemState,
        req: any,
        extraData: { outputJson?: string, reason?: string } = {}
    ): TransitionWorkItemCommand {
        return {
            workItemId: req.work_item_id,
            actorId: req.context?.actor_id || 'system',
            targetState,
            parameters: extraData.outputJson ? GrpcToCommandMapper.safeParseJson(extraData.outputJson) : undefined,
            idempotencyKey: req.context?.idempotency_key,
            initiatedAt: new Date()
        };
    }

    static toContext(req: any, action: string, targetState?: WorkItemState) {
        const validationContext: any = {
            workItemID: req.work_item_id || 0,
            actorId: req.context?.actor_id || 'system'
        };

        // Include targetState for transition commands (CLAIM, COMPLETE, CANCEL)
        if (targetState !== undefined) {
            validationContext.targetState = targetState;
        }

        return {
            action,
            validationContext,
            idempotencyKey: req.context?.idempotency_key
        };
    }

    private static parseParameters(jsonString?: string): any[] {
        if (!jsonString) return [];
        try {
            const parsed = JSON.parse(jsonString);
            return Object.entries(parsed).map(([name, value]) => ({
                name,
                direction: 'IN',
                value
            }));
        } catch (e) {
            return [];
        }
    }

    private static safeParseJson(jsonString?: string): any {
        if (!jsonString) return {};
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.warn('Failed to parse JSON parameter', e);
            return {};
        }
    }
}
