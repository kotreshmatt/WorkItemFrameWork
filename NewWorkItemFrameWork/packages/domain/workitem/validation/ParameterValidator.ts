import { ValidationResult } from './ValidationResult';
import { Logger } from '../../common/logging';

export class ParameterValidator {
  constructor(private readonly logger: Logger) { }

  async validateRequired(
    params: Record<string, any>,
    required: string[]
  ): Promise<ValidationResult> {
    console.log('[DUDE] Validating required parameters:', JSON.stringify({ params, required }, null, 2));
    this.logger.info(`Starting parameter validation. Required parameters: ${JSON.stringify(required)}`);
    this.logger.debug(`Provided parameters: ${JSON.stringify(params)}`);

    for (const key of required) {
      if (!(key in params)) {
        const errorMessage = `Missing parameter: ${key}`;
        this.logger.error(errorMessage);
        return ValidationResult.fail(errorMessage);
      }
    }

    this.logger.info('All required parameters are present. Validation passed.');
    return ValidationResult.ok();
  }

  /**
   * Validate output parameters provided during COMPLETE against work item's parameter schema
   * @param workItemParameters - Parameter schema from work item creation
   * @param outputParameters - Output parameters provided during completion
   */
  async validateOutputParameters(
    workItemParameters: Array<{ name: string; direction: string; mandatory?: boolean }>,
    outputParameters: Array<{ name: string; value: unknown }>
  ): Promise<ValidationResult> {
    this.logger.info(`Validating ${outputParameters.length} output parameters against schema`);

    // 1. Validate each provided output parameter
    for (const output of outputParameters) {
      const paramDef = workItemParameters.find(p => p.name === output.name);

      // Check parameter exists in schema
      if (!paramDef) {
        const errorMessage = `Unknown parameter: ${output.name}`;
        this.logger.error(errorMessage);
        return ValidationResult.fail(errorMessage);
      }

      // Check parameter direction is OUT or INOUT (not IN)
      if (paramDef.direction !== 'OUT' && paramDef.direction !== 'INOUT') {
        const errorMessage = `Parameter '${output.name}' has direction ${paramDef.direction}, cannot be used as output`;
        this.logger.error(errorMessage);
        return ValidationResult.fail(errorMessage);
      }

      this.logger.debug(`Parameter '${output.name}' validated successfully`);
    }

    // 2. Check all mandatory OUT/INOUT parameters are provided
    const mandatoryOutputs = workItemParameters.filter(
      p => p.mandatory && (p.direction === 'OUT' || p.direction === 'INOUT')
    );

    for (const mandatory of mandatoryOutputs) {
      const provided = outputParameters.find(p => p.name === mandatory.name);

      if (!provided || provided.value === null || provided.value === undefined) {
        const errorMessage = `Mandatory output parameter '${mandatory.name}' must be provided`;
        this.logger.error(errorMessage);
        return ValidationResult.fail(errorMessage);
      }
    }

    this.logger.info('Output parameter validation passed');
    return ValidationResult.ok();
  }
}