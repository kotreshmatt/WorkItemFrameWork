/**
 * Feature flags for framework capabilities.
 * Uses compile-time constants for zero runtime overhead.
 */
export const FEATURE_FLAGS = {
    /**
     * Enable event publishing to outbox table.
     * Default: false (zero overhead)
     */
    EVENTS_ENABLED: true as boolean,

    /**
     * Enable idempotency checks for commands.
     * Default: false (Temporal handles idempotency)
     */
    IDEMPOTENCY_ENABLED: false as boolean,

    /**
     * Enable audit logging.
     * Default: true (required for compliance)
     */
    AUDIT_ENABLED: true as boolean,

} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(feature: FeatureFlagKey): boolean {
    return FEATURE_FLAGS[feature];
}
