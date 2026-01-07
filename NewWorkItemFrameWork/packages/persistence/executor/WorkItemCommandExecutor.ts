// packages/persistence/executor/WorkItemCommandExecutor.ts

import { WorkItemCommandService } from '../../domain/workitem/commands/WorkItemCommandService';
import { JdbcPersistenceUnitOfWork } from '../common/JdbcPersistenceUnitOfWork';
import { JdbcWorkItemRepository } from '../repository/JdbcWorkItemRepository';
import { JdbcWorkItemAuditRepository } from '../repository/JdbcWorkItemAuditRepository';
import { JdbcOutboxRepository } from '../repository/JdbcOutboxRepository';
import { Logger } from '../../domain/common/logging';

import { CommandDecision } from '../../domain/workitem/results/CommandDecision';
import { ValidationResult } from '../../domain/workitem/validation/ValidationResult';
import { ExecutionResult } from '../../domain/workitem/results/ExecutionResult';
import { CreateWorkItemCommand } from '../../domain/workitem/commands/CreateWorkItemCommand';
import { TransitionWorkItemCommand } from '../../domain/workitem/commands/TransitionWorkItemCommand';

import {
  DistributionStrategyType,
  DistributionMode
} from '../../domain/workitem/WorkItemDistribution';

import { AssignmentResolver } from '../../domain/workitem/assignment/AssignmentResolver';
import { AssignmentCandidateResolver } from '../../domain/workitem/assignment/AssignmentcandidateResolver';
import { JdbcWorkItemParticipantRepository } from '../repository/JdbcWorkItemParticipantRepository';
import { JdbcWorkItemParameterRepository } from '../repository/JdbcWorkItemParameterRepository';
import { JdbcIdempotencyRepository } from '../repository/JdbcIdempotencyRepositroy';
import { FEATURE_FLAGS } from '../../config/FeatureFlags';
import { JdbcAssignmentCandidateResolver } from '../assignment/JdbcAssignmentCandidateResolver';

/**
 * Phase-4 executor
 *
 * Responsibilities:
 *  - Transaction boundary
 *  - Assignment candidate resolution (DB)
 *  - Distribution defaults
 *  - Admin fallback
 *  - Persistence + audit + outbox
 */
export class WorkItemCommandExecutor {

  private static readonly ADMIN_USER_ID = 'admin';

  constructor(
    private readonly uow: JdbcPersistenceUnitOfWork,
    private readonly commandService: WorkItemCommandService, // Phase-3
    private readonly assignmentCandidateResolver: JdbcAssignmentCandidateResolver, // Phase-4
    private readonly assignmentResolver: AssignmentResolver, // Phase-2
    private readonly workItemRepo: JdbcWorkItemRepository,
    private readonly auditRepo: JdbcWorkItemAuditRepository,
    private readonly participantRepo: JdbcWorkItemParticipantRepository,
    private readonly parameterRepo: JdbcWorkItemParameterRepository,
    private readonly outboxRepo: JdbcOutboxRepository,
    private readonly idempotencyRepo: JdbcIdempotencyRepository,
    private readonly logger: Logger
  ) { }

  async execute(
    command: CreateWorkItemCommand | TransitionWorkItemCommand,
    context: {
      action: 'CREATE' | 'CLAIM' | 'COMPLETE' | 'CANCEL' | 'TRANSITION';
      validationContext: any;
      idempotencyKey?: string; // Optional - for duplicate detection
    }
  ): Promise<ExecutionResult> {

    return this.uow.withTransaction(async (tx) => {
      this.logger.info('TX started', { action: context.action });

      // Idempotency check (skip for CREATE, optional for others)
      if (
        FEATURE_FLAGS.IDEMPOTENCY_ENABLED &&
        context.action !== 'CREATE' &&
        context.idempotencyKey
      ) {
        const workItemId = context.validationContext?.workItemID || 0;
        const isNew = await this.idempotencyRepo.tryInsert(
          tx,
          context.idempotencyKey,
          workItemId,
          context.action
        );

        if (!isNew) {
          this.logger.warn('Duplicate command detected', {
            idempotencyKey: context.idempotencyKey,
            action: context.action
          });
          return {
            decision: CommandDecision.rejected(
              ValidationResult.fail('Duplicate command detected')
            )
          };
        }
      }
      if (context.action != 'CREATE') {
        console.log('[INFO] Fetching work item ', context.validationContext.workItemID + 'for action...', context.action);
        const workItem =
          await this.workItemRepo.findById(tx, context.validationContext.workItemID);
        console.log('[INFO] Fetched work item ...', workItem);

        if (!workItem) {
          throw new Error(`WorkItem ${context.validationContext.workItemId} not found`);
        }
        else {
          context.validationContext.workItem = workItem;
        }
      }
      console.log('[INFO] Validation Context passed to decide...', context.validationContext);

      // Add command parameters to validation context (for COMPLETE output params)
      if ((command as any).parameters) {
        context.validationContext.parameters = (command as any).parameters;
      }
console.log('[INFO] Calling decide for action...', context);
      const decision =
        await this.commandService.decide(tx, {
          action: context.action,
          validationContext: context.validationContext ?? {}

        });
      console.log('[INFO] Command accepted', decision);
      if (!decision.accepted) {
        this.logger.info('Command rejected');
        return { decision };
      }

      console.log('[INFO] Command accepted', decision);
      /* -------------------------------------------------
       * 1️⃣ Phase-3: DECISION ONLY
       * ------------------------------------------------- */


      /* -------------------------------------------------
       * 2️⃣ CREATE
       * ------------------------------------------------- */
      if (context.action === 'CREATE') {
        const cmd = command as CreateWorkItemCommand;


        /* 2.1 Resolve assignment candidates (DB) */
        console.log('[INFO] Resolving assignment candidates for spec...', cmd.assignmentSpec);
        const eligibleUsers =
          await this.assignmentCandidateResolver.resolve(cmd.assignmentSpec);
        console.log('[INFO] assignmentCandidateResolver result...', eligibleUsers);
        /* 2.2 Distribution defaults */
        const strategy =
          cmd.distributionStrategy ?? DistributionStrategyType.DEFAULT;
        console.log('[INFO] distributionStrategy result...', strategy);
        const mode =
          cmd.distributionMode ?? DistributionMode.PULL;

        /* 2.3 Phase-2 distribution */
        const assignmentDecision =
          await this.assignmentResolver.resolve({
            strategy,
            mode,
            distributionContext: { eligibleUsers }
          });
        console.log('[INFO] assignmentResolver assignmentDecision...', assignmentDecision);
        /* 2.4 Admin fallback */
        const finalAssignment =
          eligibleUsers.length === 0
            ? {
              offeredTo: [],
              assignedTo: WorkItemCommandExecutor.ADMIN_USER_ID
            }
            : assignmentDecision;

        const initialState =
          finalAssignment.assignedTo ? 'CLAIMED' : 'OFFERED';
        console.log('[INFO] finalAssignment...', JSON.parse(JSON.stringify(finalAssignment.offeredTo))
        );
        /* 2.5 Persist work item */
        const workItemId =
          await this.workItemRepo.insert(tx, {
            workflowId: cmd.workflowId,
            state: initialState,
            taskType: cmd.taskType,
            taskName: cmd.taskName,
            priority: cmd.priority,
            offeredTo: finalAssignment.offeredTo,
            //assigneeId: finalAssignment.assignedTo ?? null,
            context: cmd.contextData ?? {},
            parameters: cmd.parameters ?? [],
            runId: cmd.runId,
            dueDate: cmd.dueDate
          });
        console.log('[INFO] workItemId...', workItemId);

        /* 2.6 Audit */
        await this.auditRepo.append(tx, {
          workItemId,
          action: 'CREATE',
          toState: initialState,
          actorId: cmd.initiatedBy,
          details: {
            strategy,
            mode,
            offeredTo: finalAssignment.offeredTo,
            adminFallback: eligibleUsers.length === 0
          }
        });

        await this.participantRepo.insertOfferedUsers(
          tx,
          workItemId,
          finalAssignment.offeredTo
        );

        if (cmd.parameters?.length) {
          await this.parameterRepo.insertAll(
            tx,
            workItemId,
            cmd.parameters
          );
        }

        /* 2.7 Outbox - Event Publishing */
        if (FEATURE_FLAGS.EVENTS_ENABLED) {
          await this.outboxRepo.insert(tx, {
            aggregateId: workItemId,
            aggregateType: 'WorkItem',
            eventType: 'WorkItemCreated',
            eventVersion: '1',
            payload: JSON.stringify({
              workItemId,
              workflowId: cmd.workflowId,
              runId: cmd.runId,
              taskName: cmd.taskName,
              state: initialState,
              distribution: {
                offeredTo: finalAssignment.offeredTo,
                assignedTo: finalAssignment.assignedTo
              },
              createdAt: new Date().toISOString()
            }),
            occurredAt: new Date()
          });

          this.logger.debug('Event published to outbox', {
            workItemId,
            eventType: 'WorkItemCreated'
          });
        }

        this.logger.info('WorkItem created', { workItemId });
        console.log('[DEBUG] WorkItem created', { workItemId } + 'with decision', decision);

        return { decision, workItemId };
      }

      /* -------------------------------------------------
       * 3️⃣ STATE TRANSITIONS (CLAIM / COMPLETE / CANCEL)
       * ------------------------------------------------- */
      else {
        const cmd = command as TransitionWorkItemCommand;
        const workItem =
          await this.workItemRepo.findById(tx, Number(cmd.workItemId!));

        if (!workItem) {
          throw new Error('WorkItem not found');
        }
        //const wi = context.validationContext.workItemID;


        await this.workItemRepo.transitionState(
          tx,
          {
            id: workItem.id,
            expectedVersion: workItem.version,
            toState: cmd.targetState,
            actorId: context.validationContext.actorId,
          }
        );

        await this.auditRepo.append(tx, {
          workItemId: workItem.id,
          action: context.action,
          fromState: workItem.state,
          toState: cmd.targetState,
          actorId: context.validationContext.actorId,
        });
        console.log('[INFO] WorkItem particpant table for', context.action, 'claim ...', workItem.id, 'to', cmd.targetState);
        if (context.action === 'CLAIM') {
          console.log('[INFO] Assigning work item to actor...', context.validationContext.actorId, workItem.id);
          if (context.validationContext.actorId) {
            await this.participantRepo.assign(
              tx,
              workItem.id,
              context.validationContext.actorId
            );
          }
        }

        /* Event Publishing for State Transitions */
        if (FEATURE_FLAGS.EVENTS_ENABLED) {
          const cmd = command as TransitionWorkItemCommand;

          await this.outboxRepo.insert(tx, {
            aggregateId: workItem.id,
            aggregateType: 'WorkItem',
            eventType: `WorkItem${context.action}`,
            eventVersion: '1',
            payload: JSON.stringify({
              workItemId: workItem.id,
              workflowId: workItem.workflowId,
              transition: {
                fromState: workItem.state,
                toState: cmd.targetState,
                action: context.action
              },
              actor: {
                id: context.validationContext.actorId,
                type: 'USER'
              },
              occurredAt: new Date().toISOString()
            }),
            occurredAt: new Date()
          });

          this.logger.debug('Event published to outbox', {
            workItemId: workItem.id,
            eventType: `WorkItem${context.action}`
          });
        }

        this.logger.info('WorkItem transitioned', {
          workItemId: workItem.id,
          action: context.action
        });

        return { decision, workItemId: workItem.id };
      }
    });
  }
}
