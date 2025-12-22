import { AccessContext, AccessDecision } from './access-context.types';
import { JITSettings } from './jit.types';

/**
 * Access Control Engine Interface
 * All access control engines must implement this interface
 */
export interface IAccessControlEngine {
  /**
   * Engine name identifier
   */
  readonly name: string;

  /**
   * Engine priority (lower = higher priority)
   */
  readonly priority: number;

  /**
   * Whether this engine can block access (deny overrides)
   */
  readonly isBlocking: boolean;

  /**
   * Evaluate access request
   */
  evaluate(context: AccessContext): Promise<AccessDecision>;

  /**
   * Check if engine is applicable for this context
   */
  isApplicable(context: AccessContext): boolean;
}

/**
 * Access Control Engine Types
 */
export type AccessControlEngineType =
  | 'rbac'
  | 'abac'
  | 'pbac'
  | 'rebac'
  | 'mac'
  | 'dac';

/**
 * Policy combination strategies
 */
export type PolicyCombinationStrategy =
  | 'any-allow' // Any engine allows = access granted
  | 'all-allow' // All engines must allow = access granted
  | 'priority' // Highest priority engine decides
  | 'deny-overrides' // Any deny = access denied
  | 'permit-overrides'; // Any permit = access granted

/**
 * Organization Access Control Settings
 */
export interface OrganizationAccessSettings {
  organizationId: string;

  // Enable/disable engines
  enabledEngines: {
    rbac: boolean;
    abac: boolean;
    pbac: boolean;
    rebac: boolean;
    mac: boolean;
    dac: boolean;
  };

  // Decision combination policy
  combinationPolicy: PolicyCombinationStrategy;

  // Engine priorities (lower = higher priority)
  enginePriorities: Record<AccessControlEngineType, number>;

  // JIT/JEA settings
  jitSettings: JITSettings;

  // Audit settings
  auditSettings: {
    logAllDecisions: boolean;
    logDeniedOnly: boolean;
    retentionDays: number;
    includeContext: boolean;
  };

  // Security settings
  securitySettings: {
    requireMfaForSensitiveActions: boolean;
    sensitiveActions: string[];
    maxSessionDuration: number;
    enforceIpWhitelist: boolean;
    ipWhitelist: string[];
  };
}

/**
 * Default organization access settings
 */
export const DEFAULT_ORG_ACCESS_SETTINGS: Omit<
  OrganizationAccessSettings,
  'organizationId'
> = {
  enabledEngines: {
    rbac: true, // Always enabled by default
    abac: false,
    pbac: false,
    rebac: true, // Enable for sharing features
    mac: false,
    dac: false,
  },
  combinationPolicy: 'any-allow',
  enginePriorities: {
    mac: 1, // MAC has highest priority (security clearance)
    rbac: 2,
    abac: 3,
    rebac: 4,
    pbac: 5,
    dac: 6,
  },
  jitSettings: {
    enabled: true,
    maxDurationMinutes: 480,
    requireApproval: true,
    approvalTimeoutMinutes: 60,
    autoApproveForRoles: ['super-admin'],
    autoApproveForActions: ['read'],
    notifyOnGrant: true,
    notifyOnExpiry: true,
    notifyBeforeExpiryMinutes: 15,
  },
  auditSettings: {
    logAllDecisions: true,
    logDeniedOnly: false,
    retentionDays: 90,
    includeContext: true,
  },
  securitySettings: {
    requireMfaForSensitiveActions: true,
    sensitiveActions: ['delete', 'admin', 'share'],
    maxSessionDuration: 28800, // 8 hours in seconds
    enforceIpWhitelist: false,
    ipWhitelist: [],
  },
};

