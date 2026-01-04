import { WorkItemGrpcServer } from './WorkItemGrpcServer';
import { WorkItemCommandExecutor } from '../../../persistence/executor/WorkItemCommandExecutor';
import { WorkItemCommandService } from '../../../domain/workitem/commands/WorkItemCommandService';
import { JdbcPersistenceUnitOfWork } from '../../../persistence/common/JdbcPersistenceUnitOfWork';
import { JdbcWorkItemRepository } from '../../../persistence/repository/JdbcWorkItemRepository';
import { JdbcWorkItemAuditRepository } from '../../../persistence/repository/JdbcWorkItemAuditRepository';
import { JdbcWorkItemParticipantRepository } from '../../../persistence/repository/JdbcWorkItemParticipantRepository';
import { JdbcWorkItemParameterRepository } from '../../../persistence/repository/JdbcWorkItemParameterRepository';
import { JdbcOutboxRepository } from '../../../persistence/repository/JdbcOutboxRepository';
import { JdbcIdempotencyRepository } from '../../../persistence/repository/JdbcIdempotencyRepositroy';
import { AssignmentResolver } from '../../../domain/workitem/assignment/AssignmentResolver';
import { SimpleAssignmentCandidateResolver } from './SimpleAssignmentCandidateResolver';
import { AssignmentCandidateResolver } from '../../../domain/workitem/assignment/AssignmentcandidateResolver';
import strategyRegistry from '../../../domain/workitem/distribution/strategies/DistributionStrategyRegistry';
import { OfferResolver } from '../../../domain/workitem/distribution/OfferResolver';
import { WorkItemCommandValidationService } from '../../../domain/workitem/validation-orchestrator/WorkItemCommandValidationService';
import { Pool } from 'pg';

/**
 * Bootstrap the gRPC Server
 * Initializes all framework dependencies and starts server
 */
async function bootstrap() {
    const PORT = process.env.GRPC_PORT ? parseInt(process.env.GRPC_PORT) : 50051;

    const logger = console as any;

    // 1. Database Connection Pool
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'bpmdb',
        user: process.env.DB_USER || 'bpmdb',
        password: process.env.DB_PASSWORD || 'bpmdb',
        max: 20
    });

    console.log('[Bootstrap] Database pool created');

    // 2. Initialize Repositories
    const workItemRepo = new JdbcWorkItemRepository(logger);
    const auditRepo = new JdbcWorkItemAuditRepository();
    const participantRepo = new JdbcWorkItemParticipantRepository();
    const parameterRepo = new JdbcWorkItemParameterRepository();
    const outboxRepo = new JdbcOutboxRepository();
    const idempotencyRepo = new JdbcIdempotencyRepository();

    // 3. Initialize Domain Services
    const offerResolver = new OfferResolver();
    const assignmentResolver = new AssignmentResolver(strategyRegistry, offerResolver, logger);
    const assignmentCandidateResolver = new SimpleAssignmentCandidateResolver();

    // 4. Initialize Validators
    const validators = {
        workflowValidator: null as any,
        assignmentValidator: null as any,
        stateValidator: null as any,
        eligibilityValidator: null as any,
        ownershipValidator: null as any
    };

    const validationService = new WorkItemCommandValidationService(
        validators.stateValidator,      // StateTransitionValidator
        validators.assignmentValidator, // AuthorizationValidator (mapped to correct var?) Wait, checking types...
        validators.eligibilityValidator, // AssignmentEligibilityValidator
        null as any,                    // ParameterValidator
        null as any,                    // LifecycleValidator
        null as any,                    // IdempotencyValidator
        logger
    );
    const commandService = new WorkItemCommandService(validationService, logger);

    // 5. Initialize Unit of Work
    const uow = new JdbcPersistenceUnitOfWork(pool, logger);

    // 6. Initialize Command Executor
    const executor = new WorkItemCommandExecutor(
        uow,
        commandService,
        assignmentCandidateResolver, // assignmentCandidateResolver - REAL implementation
        assignmentResolver,
        workItemRepo,
        auditRepo,
        participantRepo,
        parameterRepo,
        outboxRepo,
        idempotencyRepo,
        logger
    );

    console.log('[Bootstrap] Framework components initialized');

    // 7. Create and Start gRPC Server
    const server = new WorkItemGrpcServer(PORT, executor);

    await server.start();
    console.log(`[Bootstrap] gRPC Server listening on port ${PORT}`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('[Bootstrap] SIGTERM received, shutting down...');
        await server.stop();
        await pool.end();
        process.exit(0);
    });
}

bootstrap().catch((err) => {
    console.error('[Bootstrap] Failed to start server:', err);
    process.exit(1);
});
