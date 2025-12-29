// packages/domain/workitem/command/errors/CommandExecutionError.ts
export class CommandExecutionError extends Error {
    constructor(
      message: string,
      readonly cause?: unknown
    ) {
      super(message);
      this.name = 'CommandExecutionError';
    }
  }
  