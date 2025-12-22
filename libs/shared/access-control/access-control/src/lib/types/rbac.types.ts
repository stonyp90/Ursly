import { z } from 'zod';
import { ActionType, ResourceType } from './access-context.types';

/**
 * RBAC - Role-Based Access Control Types
 */

/**
 * Permission definition for RBAC (legacy - use entitlement.types for primary system)
 */
export const RBACPermissionSchema = z.object({
  resource: z.string(), // Resource type or '*' for all
  actions: z.array(
    z.enum(['create', 'read', 'update', 'delete', 'execute', 'share', 'admin', '*'])
  ),
  conditions: z.array(z.record(z.unknown())).optional(),
});

export type RBACPermission = z.infer<typeof RBACPermissionSchema>;

/**
 * RBAC Policy definition
 */
export const RBACPolicySchema = z.object({
  role: z.string(),
  description: z.string().optional(),
  permissions: z.array(RBACPermissionSchema),
  inheritsFrom: z.array(z.string()).optional(),
});

export type RBACPolicy = z.infer<typeof RBACPolicySchema>;

/**
 * Default RBAC policies for the platform
 */
export const DEFAULT_RBAC_POLICIES: RBACPolicy[] = [
  {
    role: 'super-admin',
    description: 'Full access to all resources across all organizations',
    permissions: [{ resource: '*', actions: ['*'] }],
  },
  {
    role: 'org-owner',
    description: 'Full access within organization',
    permissions: [
      { resource: 'agent', actions: ['*'] },
      { resource: 'model', actions: ['*'] },
      { resource: 'task', actions: ['*'] },
      { resource: 'conversation', actions: ['*'] },
      { resource: 'document', actions: ['*'] },
      { resource: 'organization', actions: ['read', 'update'] },
      { resource: 'audit-log', actions: ['read'] },
    ],
  },
  {
    role: 'agent-admin',
    description: 'Administrator role for agent management',
    permissions: [
      { resource: 'agent', actions: ['*'] },
      { resource: 'model', actions: ['*'] },
      { resource: 'task', actions: ['*'] },
      { resource: 'conversation', actions: ['*'] },
      { resource: 'audit-log', actions: ['read'] },
    ],
  },
  {
    role: 'agent-user',
    description: 'Standard user with limited access',
    permissions: [
      { resource: 'agent', actions: ['read', 'execute'] },
      { resource: 'model', actions: ['read'] },
      { resource: 'conversation', actions: ['create', 'read', 'update'] },
      { resource: 'task', actions: ['read'] },
    ],
  },
  {
    role: 'viewer',
    description: 'Read-only access to all resources',
    permissions: [{ resource: '*', actions: ['read'] }],
  },
];

