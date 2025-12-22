import { z } from 'zod';

/**
 * JIT - Just-In-Time Access Types
 * JEA - Just Enough Access Types
 */

/**
 * JIT Access Request
 */
export const JITAccessRequestSchema = z.object({
  userId: z.string(),
  resourceId: z.string(),
  resourceType: z.string(),
  requestedActions: z.array(z.string()),
  justification: z.string().min(10, 'Justification must be at least 10 characters'),
  duration: z.number().min(5).max(1440), // 5 minutes to 24 hours
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  ticketId: z.string().optional(), // Link to external ticket system
});

export type JITAccessRequest = z.infer<typeof JITAccessRequestSchema>;

/**
 * JIT Access Grant
 */
export const JITAccessGrantSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  resourceId: z.string(),
  resourceType: z.string(),
  grantedActions: z.array(z.string()),
  createdAt: z.date(),
  expiresAt: z.date(),
  approvedBy: z.string(),
  justification: z.string(),
  status: z.enum(['active', 'expired', 'revoked']),
  revokedAt: z.date().optional(),
  revokedBy: z.string().optional(),
  revokeReason: z.string().optional(),
});

export type JITAccessGrant = z.infer<typeof JITAccessGrantSchema>;

/**
 * Pending JIT Approval
 */
export const PendingApprovalSchema = z.object({
  id: z.string().uuid(),
  request: JITAccessRequestSchema,
  requestedAt: z.date(),
  requestedBy: z.string(),
  approvers: z.array(z.string()),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']),
  processedAt: z.date().optional(),
  processedBy: z.string().optional(),
  processingNote: z.string().optional(),
});

export type PendingApproval = z.infer<typeof PendingApprovalSchema>;

/**
 * JIT Settings for an organization
 */
export interface JITSettings {
  enabled: boolean;
  maxDurationMinutes: number;
  requireApproval: boolean;
  approvalTimeoutMinutes: number;
  autoApproveForRoles: string[];
  autoApproveForActions: string[];
  notifyOnGrant: boolean;
  notifyOnExpiry: boolean;
  notifyBeforeExpiryMinutes: number;
}

/**
 * Default JIT settings
 */
export const DEFAULT_JIT_SETTINGS: JITSettings = {
  enabled: true,
  maxDurationMinutes: 480, // 8 hours
  requireApproval: true,
  approvalTimeoutMinutes: 60,
  autoApproveForRoles: ['super-admin'],
  autoApproveForActions: ['read'],
  notifyOnGrant: true,
  notifyOnExpiry: true,
  notifyBeforeExpiryMinutes: 15,
};

/**
 * JEA - Just Enough Access configuration
 */
export interface JEAConfig {
  // Map of requested actions to minimal granted actions
  actionReduction: Record<string, string[]>;
  // Maximum scope per action type
  maxScopePerAction: Record<string, string>;
  // Whether to apply JEA automatically
  autoApply: boolean;
}

/**
 * Default JEA configuration
 */
export const DEFAULT_JEA_CONFIG: JEAConfig = {
  actionReduction: {
    // Request admin, grant only what's needed
    admin: ['read', 'update'],
    // Request delete, ensure they can read first
    delete: ['read', 'delete'],
    // Request share, ensure they can read
    share: ['read', 'share'],
  },
  maxScopePerAction: {
    read: '*',
    update: 'own',
    delete: 'own',
    execute: 'assigned',
    share: 'own',
  },
  autoApply: true,
};

