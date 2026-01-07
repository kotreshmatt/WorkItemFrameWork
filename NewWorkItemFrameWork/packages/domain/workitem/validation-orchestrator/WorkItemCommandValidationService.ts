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
import { TransactionContext } from '../../../persistence/common/TransactionContext';

export class WorkItemCommandValidationService {
  constructor(
    private readonly stateValidator: StateTransitionValidator,
    private readonly authValidator: AuthorizationValidator,
    private readonly assignmentValidator: AssignmentEligibilityValidator,
    private readonly parameterValidator: ParameterValidator,
    private readonly lifecycleValidator: LifecycleValidator,
    private readonly idempotencyValidator: IdempotencyValidator,
    private readonly logger: Logger
  ) { }

  async validate(tx: TransactionContext, context: ValidationContext): Promise<ValidationResult> {
    try {
      if (!context.workItem) {
        this.logger.error('Validation failed: workItem is undefined');
        console.error('[ERROR] Validation Context:', context);
        return ValidationResult.fail('Validation failed: workItem is undefined');
      }

      this.logger.info(`Starting validation for work item with ID: ${context.workItem.id}`);
      console.error('[INFO] Validation Context for :', context.action, context);

      // 1. Lifecycle validity
      this.logger.info('Validating lifecycle...');
      const lifecycleResult = this.lifecycleValidator.validate(
        'default',
        context.workItem.state,
        context.targetState
      );

      if (!(await lifecycleResult).valid) {
        this.logger.error('Lifecycle validation failed.');
        return lifecycleResult;
      }

      // 3. Authorization
      this.logger.info('Validating authorization...');
      const assigneeId = (context.workItem as any).assigneeId ?? (context.workItem as any).assignee_id;

      const authResult = await this.authValidator.validate(
        context.action,
        context.actorId,
        { assigneeId, state: context.workItem.state }
      );

      if (!authResult.valid) {
        this.logger.error('Authorization validation failed.');
        return authResult;
      }

      // 4. Assignment eligibility (only when claiming)
      if (context.targetState === 'CLAIMED') {
        this.logger.info('Validating assignment eligibility...');
        const assignmentResult = await this.assignmentValidator.validate(
          tx,
          context.workItem,
          context.actorId
        );
        if (!assignmentResult.valid) {
          this.logger.error('Assignment eligibility validation failed.');
          return assignmentResult;
        }
      }

      // CHECKPOINT: if you don't see this, we returned/threw earlier
      console.log('[CHECKPOINT] Reached parameter validation block');

      const parametersToValidate =
        (context as any).parameters ?? (context.workItem as any)?.parameters;

      console.log('[CHECKPOINT] parametersToValidate:', parametersToValidate);

      // 5. Parameters
      if (context.parameters) {
        this.logger.info('Validating parameters...');

        // For COMPLETE action, validate output parameters
        if (context.action === 'COMPLETE' && (context.workItem as any)?.parameters) {
          console.log('[CHECKPOINT] Validating output parameters for COMPLETE action');
          this.logger.info('Validating output parameters for COMPLETE action...');

          const outputParams = Array.isArray(context.parameters)
            ? context.parameters
            : JSON.parse(context.parameters as any);
            console.log('[CHECKPOINT] outputParams:', outputParams);

          const wiParams = Array.isArray((context.workItem as any).parameters)
            ? (context.workItem as any).parameters
            : JSON.parse((context.workItem as any).parameters as any);

          const outputParamResult = await this.parameterValidator.validateOutputParameters(
            wiParams,
            outputParams
          );

          if (!outputParamResult.valid) {
            this.logger.error('Output parameter validation failed.');
            return outputParamResult;
          }
          this.logger.info('Output parameter validation passed.');
        } else {
          const paramResult = await this.parameterValidator.validateRequired(
            context.parameters,
            []
          );
          if (!paramResult.valid) {
            this.logger.error('Parameter validation failed.');
            return paramResult;
          }
        }
        this.logger.info('Parameter validation passed.');
      } else {
        console.log('[INFO] No parameters to validate.');
      }

      // 6. Idempotency...
      if (context.idempotent !== undefined) {
        this.logger.info('Validating idempotency...');
        const idempotencyResult = await this.idempotencyValidator.validate(context.idempotent);
        if (!idempotencyResult.valid) {
          this.logger.error('Idempotency validation failed.');
          return idempotencyResult;
        }
      }

      this.logger.info('All validations passed successfully.');
      return ValidationResult.ok();
    } catch (err) {
      console.error('[ERROR] validate() threw:', err);
      this.logger.error('validate() threw', err as any);
      return ValidationResult.fail('Validation threw unexpectedly');
    }
  }
}