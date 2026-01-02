// packages/domain/workitem/validation/AuthorizationValidator.ts
import { ValidationResult } from './ValidationResult';
import { Logger } from '../../common/logging';

const ADMIN_USER = 'admin';

export class AuthorizationValidator {

  constructor(private readonly logger: Logger) {}

  async validate(
    action: 'CREATE'|'CLAIM' | 'COMPLETE' | 'CANCEL' | 'TRANSITION',
    actorId: string,
    workItem: {
      assigneeId?: string;
      state: string;
    }
  ): Promise<ValidationResult> {
console.log('[INFO] AuthorizationValidator validate called with:', { action, actorId, workItem });
    this.logger.info(
      `Authorization check: action=${action}, actor=${actorId}, assignee=${workItem.assigneeId}`
    );

    // System / admin override
    if (actorId === ADMIN_USER) {
      return ValidationResult.ok();
    }

    switch (action) {

      case 'CLAIM':
        if (workItem.assigneeId) {
          return ValidationResult.fail('Work item already claimed');
        }
        return ValidationResult.ok();

      case 'COMPLETE':
        if (workItem.assigneeId !== actorId) {
          return ValidationResult.fail(
            'Only assignee can complete work item'
          );
        }
        return ValidationResult.ok();

      case 'CANCEL':
        if (workItem.assigneeId !== actorId) {
          return ValidationResult.fail(
            'Only assignee or admin can cancel work item'
          );
        }
        return ValidationResult.ok();

      case 'TRANSITION':
        if (workItem.assigneeId !== actorId) {
          return ValidationResult.fail(
            'Unauthorized state transition'
          );
        }
        return ValidationResult.ok();

      default:
        return ValidationResult.fail('Unknown action');
    }
  }
}
