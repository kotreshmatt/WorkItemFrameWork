// packages/domain/workitem/results/CommandDecision.ts

import { ValidationResult } from '../validation/ValidationResult';
import { AssignmentResult } from '../assignment/AssignmentResolver';

export class CommandDecision {

  private constructor(
    readonly accepted: boolean,
    readonly validationResult?: ValidationResult,

    // CREATE
    readonly initialState?: string,
    readonly assignmentDecision?: AssignmentResult,

    // TRANSITION / CLAIM / COMPLETE / CANCEL
    readonly fromState?: string,
    readonly toState?: string
  ) {}

  static acceptedCreate(data: {
    initialState: string;
    assignmentDecision?: AssignmentResult | undefined;
  }): CommandDecision {
    return new CommandDecision(
      true,
      undefined,
      data.initialState,
      data.assignmentDecision
    );
  }

  static acceptedTransition(data: {
    fromState: string;
    toState: string;
  }): CommandDecision {
    return new CommandDecision(
      true,
      undefined,
      undefined,
      undefined,
      data.fromState,
      data.toState
    );
  }

  static rejected(validationResult: ValidationResult): CommandDecision {
    return new CommandDecision(false, validationResult);
  }
}
