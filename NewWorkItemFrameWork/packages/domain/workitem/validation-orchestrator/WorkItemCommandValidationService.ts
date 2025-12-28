import { ValidationContext } from './ValidationContext';
import { ValidationResult } from '../validation/ValidationResult';
import {
  StateTransitionValidator,
  AuthorizationValidator,
  AssignmentEligibilityValidator,
  ParameterValidator,
  LifecycleValidator,
  IdempotencyValidator
} from '../validation/index';
import { Logger } from '../../common/logging';

export class WorkItemCommandValidationService {
  constructor(
    private readonly stateValidator: StateTransitionValidator,
    private readonly authValidator: AuthorizationValidator,
    private readonly assignmentValidator: AssignmentEligibilityValidator,
    private readonly parameterValidator: ParameterValidator,
    private readonly lifecycleValidator: LifecycleValidator,
    private readonly idempotencyValidator: IdempotencyValidator,
    private readonly logger: Logger
  ) {}

  async validate(context: ValidationContext): Promise<ValidationResult> {
    this.logger.info(`Starting validation for work item with ID: ${context.workItem.id}`);
    this.logger.debug(`Validation context: ${JSON.stringify(context)}`);

    // 1. Lifecycle validity
    this.logger.info('Validating lifecycle...');
    const lifecycleResult = this.lifecycleValidator.validate(
      [context.workItem.state],
      context.targetState
    );
    if (!(await lifecycleResult).valid) {
      this.logger.error('Lifecycle validation failed.');
      return lifecycleResult;
    }
    this.logger.info('Lifecycle validation passed.');

    // 2. State transition
    this.logger.info('Validating state transition...');
    const stateResult = await this.stateValidator.validate(
      context.workItem.state,
      context.targetState
    );
    if (!stateResult.valid) {
      this.logger.error('State transition validation failed.');
      return stateResult;
    }
    this.logger.info('State transition validation passed.');

    // 3. Authorization
    this.logger.info('Validating authorization...');
    const authResult = await this.authValidator.validate(
      context.actorId,
      context.workItem.assigneeId
    );
    if (!authResult.valid) {
      this.logger.error('Authorization validation failed.');
      return authResult;
    }
    this.logger.info('Authorization validation passed.');

    // 4. Assignment eligibility (only when claiming)
    if (context.targetState === 'CLAIMED') {
      this.logger.info('Validating assignment eligibility...');
      const assignmentResult = await this.assignmentValidator.validate(
        context.workItem,
        context.actorId
      );
      if (!assignmentResult.valid) {
        this.logger.error('Assignment eligibility validation failed.');
        return assignmentResult;
      }
      this.logger.info('Assignment eligibility validation passed.');
    }

    // 5. Parameters
    if (context.parameters) {
      this.logger.info('Validating parameters...');
      const paramResult = await this.parameterValidator.validateRequired(
        context.parameters,
        [] // schema resolved later (Phase 3)
      );
      if (!paramResult.valid) {
        this.logger.error('Parameter validation failed.');
        return paramResult;
      }
      this.logger.info('Parameter validation passed.');
    }

    // 6. Idempotency
    if (context.idempotent !== undefined) {
      this.logger.info('Validating idempotency...');
      const idempotencyResult = await this.idempotencyValidator.validate(context.idempotent);
      if (!idempotencyResult.valid) {
        this.logger.error('Idempotency validation failed.');
        return idempotencyResult;
      }
      this.logger.info('Idempotency validation passed.');
    }

    this.logger.info('All validations passed successfully.');
    return ValidationResult.ok();
  }
}