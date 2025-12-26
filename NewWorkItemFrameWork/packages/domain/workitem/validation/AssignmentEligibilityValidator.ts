import { WorkItemAssignmentSpec } from '../WorkItemAssignmentSpec';
import { ValidationResult } from './ValidationResult';

export class AssignmentEligibilityValidator {

  validate(
    userId: string,
    spec: WorkItemAssignmentSpec
  ): ValidationResult {

    if (spec.candidateUsers?.includes(userId)) {
      return ValidationResult.ok();
    }

    return ValidationResult.fail('User not eligible for assignment');
  }
}
