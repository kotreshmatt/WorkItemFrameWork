import { Pool } from 'pg';
import { JdbcPersistenceUnitOfWork } from '../../packages/persistence/common/JdbcPersistenceUnitOfWork';
import { JdbcWorkItemRepository } from '../../packages/persistence/repository/JdbcWorkItemRepository';
import { JdbcWorkItemAuditRepository } from '../../packages/persistence/repository/JdbcWorkItemAuditRepository';
import { JdbcOutboxRepository } from '../../packages/persistence/repository/JdbcOutboxRepository';
import { JdbcOrgModelRepository } from '../../packages/persistence/repository/JdbcOrgModelRepository';
import { JdbcAssignmentCandidateResolver } from '../../packages/persistence/assignment/JdbcAssignmentCandidateResolver';

import { AssignmentResolver } from '../../packages/domain/workitem/assignment/AssignmentResolver';
import { DistributionStrategyRegistry } from '../../packages/domain/workitem/distribution/strategies/DistributionStrategyRegistry';
import { WorkItemCommandValidationService } from '../../packages/domain/workitem/validation-orchestrator/WorkItemCommandValidationService';
import { AssignmentEligibilityValidator } from '../../packages/domain/workitem/validation/AssignmentEligibilityValidator';
import { LifecycleEngine } from '../../packages/domain/workitem/Lifecycle/LifecycleEngine';
import { WorkItemCommandService } from '../../packages/domain/workitem/commands/WorkItemCommandService';
import { WorkItemCommandExecutor } from '../../packages/persistence/executor/WorkItemCommandExecutor';

import { CreateWorkItemCommand } from '../../packages/domain/workitem/commands/CreateWorkItemCommand';
import { TransitionWorkItemCommand } from '../../packages/domain/workitem/commands/TransitionWorkItemCommand';
import { WorkItemState } from '../../packages/domain/workitem/WorkItemState';
import { OfferResolver } from '../../packages/domain/workitem/distribution/OfferResolver';
import {
  StateTransitionValidator,
  AuthorizationValidator,
  //AssignmentEligibilityValidator,
  ParameterValidator,
  LifecycleValidator,
  IdempotencyValidator
} from '../../packages/domain/workitem/validation/index';
import { DistributionMode, DistributionStrategyType } from '../../packages/domain';
import * as dotenv from 'dotenv';
import { OfferToAllStrategy } from '../../packages/domain/workitem/distribution/strategies/OfferToAllStrategy';
dotenv.config();

class TestLogger {
  trace(message: string, meta?: unknown) {}
  info(message: string, meta?: unknown) {}
  debug(message: string, meta?: unknown) {}
  warn(message: string, meta?: unknown) {}
  error(message: string, meta?: unknown) {}
}

describe('E2E WorkItem lifecycle (Postgres)', () => {
  let pool: Pool;
  let executor: WorkItemCommandExecutor;

  beforeAll(async () => {
    pool = new Pool({ connectionString: 'postgresql://bpmdb:bpmdb@localhost:5432/bpmdb' });
    //await pool.query(`BEGIN`);
    //await pool.query(require('fs').readFileSync('tests/testdata.sql', 'utf8'));
    //await pool.query(`COMMIT`);

   /* try {
      console.log('[INFO] Running test data setup...');
      await pool.query(`BEGIN`);
      await pool.query(require('fs').readFileSync('tests/testdata.sql', 'utf8'));
      await pool.query(`COMMIT`);
      console.log('[INFO] Test data setup completed.');
    } catch (error) {
      console.error('[ERROR] Error during test data setup:', error);
      throw error;
    }*/
    const strategyRegistry = new DistributionStrategyRegistry();
    console.log('[INFO] Registering OFFER_TO_ALL strategy for test...');
    strategyRegistry.register(new OfferToAllStrategy());
    const logger = new TestLogger();
    const uow = new JdbcPersistenceUnitOfWork(pool, logger);

    const orgRepo = new JdbcOrgModelRepository(pool,logger);
    const candidateResolver = new JdbcAssignmentCandidateResolver(pool, logger);

    const offerresolver = new OfferResolver();

    const assignmentResolver =
      new AssignmentResolver(strategyRegistry, offerresolver, logger);

    const eligibilityValidator =
      new AssignmentEligibilityValidator(orgRepo, logger);

    const validationService =
      new WorkItemCommandValidationService(
        new StateTransitionValidator(logger),
        new AuthorizationValidator(logger),
        eligibilityValidator,
        new ParameterValidator(logger),
        new LifecycleValidator(logger),
        new IdempotencyValidator(logger),
        logger,
        // Add the missing argument here
      );

    const lifecycleEngine = new LifecycleEngine();

    const commandService =
      new WorkItemCommandService(
        validationService,
        logger
      );

    executor =
      new WorkItemCommandExecutor(
        uow,
        commandService,
        new JdbcAssignmentCandidateResolver(pool, logger),
        assignmentResolver,
        new JdbcWorkItemRepository(logger),
        new JdbcWorkItemAuditRepository(),
        new JdbcOutboxRepository,
        logger
      );
      console.log('[INFO] Test setup completed.');
  });

  it('CREATE → CLAIM → COMPLETE → CANCEL', async () => {

    // CREATE
    console.log('[INFO] Executing CREATE command...');
    const createCmd: CreateWorkItemCommand = {
      //workItemId: 'WI-1',
      workflowId: 'wf1',
      runId: 'run1',
      taskType: 'Technical-Exception',
      taskName: 'Handle exception',
      assignmentSpec: {
        candidatePositions: ['manager'],
        strategy: DistributionStrategyType.DEFAULT,
        mode: DistributionMode.PULL
      },
      lifecycle: 'default',
      initiatedBy: 'system',
      initiatedAt: new Date(),
      parameters: [
        {
          name: 'request',
          direction: 'IN',
          //type: 'object',
          value: {  errocode: 'ERROR_CODE', errorMessage: 'Error message' }
        },
        {
          name: 'retry',
          direction: 'INOUT',
          //type: 'boolean',
          mandatory: false,
          value: null
        },
        {
          name: 'comments',
          direction: 'INOUT',
          //type: 'string',
          mandatory: false,
          value: null
        },
        {
          name: 'skiperror',
          direction: 'OUT',
          //type: 'boolean',
          value: null
        }
      ],
      contextData: {  additionalInfo: 'Test work item' }
    };

    const createDecision =
      await executor.execute(createCmd, {
        action: 'CREATE',
        validationContext: {}
      });
    console.log('[DEBUG] Create Decision:', createDecision);
    expect(createDecision.accepted).toBe(true);

    const wiRow =
      await pool.query(`SELECT * FROM work_items WHERE workflow_id='wf1'`);

    const workItemId = wiRow.rows[0].id;
    expect(wiRow.rows[0].state).toBe('OFFERED');

    // CLAIM
    const claimCmd: TransitionWorkItemCommand = {
      workItemId,
      targetState: WorkItemState.CLAIMED,
      actorId: 'user1',
      initiatedAt: new Date()
    };

    const claimDecision =
      await executor.execute(claimCmd, {
        action: 'CLAIM',
        validationContext: {
          workItem: wiRow.rows[0],
          actorId: 'user1'
        }
      });

    expect(claimDecision.accepted).toBe(true);

    // COMPLETE
    const completeCmd: TransitionWorkItemCommand = {
      workItemId,
      targetState: WorkItemState.COMPLETED,
      actorId: 'user1',
      initiatedAt: new Date()
    };

    const completeDecision =
      await executor.execute(completeCmd, {
        action: 'COMPLETE',
        validationContext: {
          workItem: { ...wiRow.rows[0], state: 'CLAIMED' },
          actorId: 'user1'
        }
      });

    expect(completeDecision.accepted).toBe(true);

    // CANCEL (new WI)
    const cancelCreate =
      await executor.execute(createCmd, {
        action: 'CREATE',
        validationContext: {}
      });

    const cancelWi =
      await pool.query(`SELECT * FROM work_items ORDER BY id DESC LIMIT 1`);

    const cancelCmd: TransitionWorkItemCommand = {
      workItemId: cancelWi.rows[0].id,
      targetState: WorkItemState.CANCELLED,
      actorId: 'admin',
      initiatedAt: new Date()
    };

    const cancelDecision =
      await executor.execute(cancelCmd, {
        action: 'CANCEL',
        validationContext: {
          workItem: cancelWi.rows[0],
          actorId: 'admin'
        }
      });

    expect(cancelDecision.accepted).toBe(true);
  });

  afterAll(async () => {
    await pool.end();
  });
});
