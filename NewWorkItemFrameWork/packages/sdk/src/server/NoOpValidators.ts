import { ValidationResult } from '../../../domain/workitem/validation/ValidationResult';

/**
 * No-op validators for SDK-only mode
 * These allow all operations to pass validation
 */

export class NoOpStateTransitionValidator {
    validate(command: any, context: any): ValidationResult {
        return { valid: true };
    }
}

export class NoOpAuthorizationValidator {
    validate(command: any, context: any): ValidationResult {
        return { valid: true };
    }
}

export class NoOpAssignmentEligibilityValidator {
    validate(command: any, context: any): ValidationResult {
        return { valid: true };
    }
}

export class NoOpParameterValidator {
    validate(command: any, context: any): ValidationResult {
        return { valid: true };
    }
}

export class NoOpLifecycleValidator {
    validate(command: any, context: any): ValidationResult {
        return { valid: true };
    }
}

export class NoOpIdempotencyValidator {
    validate(command: any, context: any): ValidationResult {
        return { valid: true };
    }
}
