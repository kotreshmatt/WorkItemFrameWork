// packages/persistence/executor/WorkItemCommandExecutor.ts

import { WorkItemCommandService } from '../../domain/workitem/commands/WorkItemCommandService';
import { JdbcPersistenceUnitOfWork } from '../common/JdbcPersistenceUnitOfWork';
import { JdbcWorkItemRepository } from '../repository/JdbcWorkItemRepository';
import { JdbcWorkItemAuditRepository } from '../repository/JdbcWorkItemAuditRepository';
import { JdbcOutboxRepository } from '../repository/JdbcOutboxRepository';
import { Logger } from '../../domain/common/logging';

import { CommandDecision } from '../../domain/workitem/results/CommandDecision';
import { CreateWorkItemCommand } from '../../domain/workitem/commands/CreateWorkItemCommand';
import { TransitionWorkItemCommand } from '../../domain/workitem/commands/TransitionWorkItemCommand';

import {
  DistributionStrategyType,
  DistributionMode
} from '../../domain/workitem/WorkItemDistribution';

import { AssignmentResolver } from '../../domain/workitem/assignment/AssignmentResolver';
import { AssignmentCandidateResolver } from '../../domain/workitem/assignment/AssignmentcandidateResolver';

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
    private readonly assignmentCandidateResolver: AssignmentCandidateResolver, // Phase-4
    private readonly assignmentResolver: AssignmentResolver, // Phase-2
    private readonly workItemRepo: JdbcWorkItemRepository,
    private readonly auditRepo: JdbcWorkItemAuditRepository,
    private readonly outboxRepo: JdbcOutboxRepository,
    private readonly logger: Logger
  ) {}

  async execute(
    command: CreateWorkItemCommand | TransitionWorkItemCommand,
    context: {
      action: 'CREATE' | 'CLAIM' | 'COMPLETE' | 'CANCEL' | 'TRANSITION';
      validationContext: any;
    }
  ): Promise<CommandDecision> {

    return this.uow.withTransaction(async (tx) => {

      this.logger.info('TX started', { action: context.action });
      const decision =
      await this.commandService.decide({
        action: context.action,
        validationContext: context.validationContext ?? {}
      });

    if (!decision.accepted) {
      this.logger.info('Command rejected');
      return decision;
    }
      

      /* -------------------------------------------------
       * 1️⃣ Phase-3: DECISION ONLY
       * ------------------------------------------------- */
      

      /* -------------------------------------------------
       * 2️⃣ CREATE
       * ------------------------------------------------- */
      if (context.action === 'CREATE') {
        const cmd = command as CreateWorkItemCommand;
        

        /* 2.1 Resolve assignment candidates (DB) */
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
            distributionContext:  {eligibleUsers }
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

        /* 2.7 Outbox (no payload – Phase-7) */
       /* await this.outboxRepo.insert(tx, {
          aggregateId: workItemId,
          eventType: 'WorkItemCreated'
        });*/

        this.logger.info('WorkItem created', { workItemId });

        return decision;
      }

      /* -------------------------------------------------
       * 3️⃣ STATE TRANSITIONS (CLAIM / COMPLETE / CANCEL)
       * ------------------------------------------------- */
      else{
      const wi = context.validationContext.workItem;
      const cmd = command as TransitionWorkItemCommand;

      await this.workItemRepo.transitionState(
        tx,
        {
          id: wi.id,
          expectedVersion: wi.version,
          toState: cmd.targetState,
          actorId:context.validationContext.actorId,
        }
      );

      await this.auditRepo.append(tx, {
        workItemId: wi.id,
        action: context.action,
        fromState: wi.state,
        toState: cmd.targetState,
        actorId:context.validationContext.actorId,
      });

      await this.outboxRepo.insert(tx, {
        aggregateId: wi.id,
        eventType: `WorkItem${context.action}`
      });

      this.logger.info('WorkItem transitioned', {
        workItemId: wi.id,
        action: context.action
      });

      return decision;
    }
    });
  }
}
