import { WorkItemState } from '../WorkItemState';
import { ValidationResult } from './ValidationResult';
import { Logger } from '../../common/logging';
import { LifecycleDefinitionLoader } from '../Lifecycle/LifecycleDefinitionLoader';

export class LifecycleValidator {
  constructor(
    private readonly logger: Logger,
    private readonly lifecycleDefinitionLoader: LifecycleDefinitionLoader
  ) {}
  async validate(
    lifecycleName: string,
    current: WorkItemState,
    target: WorkItemState
  ): Promise<ValidationResult> {
    this.logger.info(`Starting lifecycle validation for current state: ${current}, target state: ${target}`);
    console.log('[INFO] LifecycleValidator Input:', { lifecycleName, current, target });
    const currentEnum = current as string;
    const targetEnum = target as string;
    try {
      // Load the lifecycle definition
      const lifecycleDefinition = this.lifecycleDefinitionLoader.load(lifecycleName);
      console.log('[INFO] Loaded Lifecycle Definition:', lifecycleDefinition);
      console.log('[DEBUG] Current State:', currentEnum);
console.log('[DEBUG] Target State:', targetEnum);
      this.logger.debug(`Loaded lifecycle definition: ${JSON.stringify(lifecycleDefinition)}`);

      // Get the valid transitions for the current state
      const validTransitions = lifecycleDefinition.transitions[current] || [];
      console.log('[INFO] Valid Transitions:', validTransitions);
      this.logger.debug(`Valid transitions for state '${current}': ${JSON.stringify(validTransitions)}`);
      const isValidTransition = validTransitions.some(
        (transition) => transition === target
      );
      console.log('[DEBUG] Is Valid Transition:', isValidTransition);
      // Check if the target state is a valid transition
      if (isValidTransition) {
        this.logger.info(`Validation passed: Transition from '${current}' to '${target}' is valid.`);
        console.log('[INFO] Lifecycle validation passed.' , ValidationResult.ok());
        return ValidationResult.ok();
      } else {
        const errorMessage = `Validation failed: Transition from '${current}' to '${target}' is not valid.`;
        this.logger.error(errorMessage);
        return ValidationResult.fail(errorMessage);
      }
    } catch (error) {
      const errorMessage = `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.logger.error(errorMessage);
      return ValidationResult.fail(errorMessage);
    }
  }
}