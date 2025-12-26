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

export class WorkItemCommandValidationService {

  constructor(
    private readonly stateValidator: StateTransitionValidator,
    private readonly authValidator: AuthorizationValidator,
    private readonly assignmentValidator: AssignmentEligibilityValidator,
    private readonly parameterValidator: ParameterValidator,
    private readonly lifecycleValidator: LifecycleValidator,
    private readonly idempotencyValidator: IdempotencyValidator
  ) {}

  validate(context: ValidationContext): ValidationResult {

    // 1. Lifecycle validity
    const lifecycleResult = this.lifecycleValidator.validate(
      Object.values(context.workItem.state.constructor),
      context.workItem.state
    );
    if (!lifecycleResult.valid) return lifecycleResult;

    // 2. State transition
    const stateResult = this.stateValidator.validate(
      context.workItem.state,
      context.targetState
    );
    if (!stateResult.valid) return stateResult;

    // 3. Authorization
    const authResult = this.authValidator.validate(
      context.actorId,
      context.workItem.assigneeId
    );
    if (!authResult.valid) return authResult;

    // 4. Assignment eligibility (only when claiming)
    if (context.targetState === 'CLAIMED') {
      const assignmentResult =
        this.assignmentValidator.validate(
          context.actorId,
          context.workItem.assignmentSpec
        );
      if (!assignmentResult.valid) return assignmentResult;
    }

    // 5. Parameters
    if (context.parameters) {
      const paramResult =
        this.parameterValidator.validateRequired(
          context.parameters,
          [] // schema resolved later (Phase 3)
        );
      if (!paramResult.valid) return paramResult;
    }

    // 6. Idempotency
    if (context.idempotent !== undefined) {
      const idempotencyResult =
        this.idempotencyValidator.validate(context.idempotent);
      if (!idempotencyResult.valid) return idempotencyResult;
    }

    return ValidationResult.ok();
  }
}
