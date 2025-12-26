export class ValidationResult {
    private constructor(
      readonly valid: boolean,
      readonly reason?: string
    ) {}
  
    static ok(): ValidationResult {
      return new ValidationResult(true);
    }
  
    static fail(reason: string): ValidationResult {
      return new ValidationResult(false, reason);
    }
  }
  