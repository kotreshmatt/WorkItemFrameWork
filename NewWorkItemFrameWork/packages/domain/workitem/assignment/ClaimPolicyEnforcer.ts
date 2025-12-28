import { WorkItem } from '../WorkItem';
import { ValidationResult } from '../validation/ValidationResult';

export class ClaimPolicyEnforcer {

  validateClaim(workItem: WorkItem, actorId: string): ValidationResult {
    if (workItem.assigneeId) {
      return ValidationResult.fail('Already claimed');
    }
    return ValidationResult.ok();
  }
}
