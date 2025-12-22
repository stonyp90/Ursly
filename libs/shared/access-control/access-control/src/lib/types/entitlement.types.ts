import { z } from 'zod';

// =============================================================================
// Permission (Entitlement) Schema
// =============================================================================
// Granular permissions that can be assigned to groups
// Format: "resource:action" (e.g., "agents:create", "models:delete")

export const PermissionCategoryEnum = z.enum([
  'agents',
  'models',
  'tasks',
  'audit',
  'connectors',
  'settings',
  'users',
  'groups',
  'permissions',
  'organization',
  'billing',
  'api',
]);

export const PermissionActionEnum = z.enum([
  'create',
  'read',
  'update',
  'delete',
  'execute',
  'manage',
  'export',
  'import',
  'approve',
  'assign',
]);

export const PermissionSchema = z.object({
  id: z.string().uuid(),
  code: z.string().regex(/^[a-z]+:[a-z]+$/, 'Format: resource:action'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: PermissionCategoryEnum,
  action: PermissionActionEnum,
  isSystem: z.boolean().default(false), // System permissions cannot be deleted
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Permission = z.infer<typeof PermissionSchema>;
export type PermissionCategory = z.infer<typeof PermissionCategoryEnum>;
export type PermissionAction = z.infer<typeof PermissionActionEnum>;

// =============================================================================
// Permission Group Schema
// =============================================================================
// Groups bundle multiple permissions together to form "roles"
// Users are assigned to groups, not individual permissions

export const PermissionGroupTypeEnum = z.enum([
  'system', // Built-in groups (cannot be deleted)
  'custom', // User-created groups
  'default', // Automatically assigned to new users
]);

export const PermissionGroupSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: PermissionGroupTypeEnum,
  permissions: z.array(z.string().uuid()), // Array of Permission IDs
  isDefault: z.boolean().default(false), // Auto-assign to new users
  priority: z.number().int().min(0).default(0), // Higher = more priority in conflicts
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(), // UI display color
  icon: z.string().max(50).optional(), // Icon identifier
  metadata: z.record(z.unknown()).optional(),
  createdBy: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PermissionGroup = z.infer<typeof PermissionGroupSchema>;
export type PermissionGroupType = z.infer<typeof PermissionGroupTypeEnum>;

// =============================================================================
// User Entitlement Schema
// =============================================================================
// Links users to permission groups within an organization

export const UserEntitlementStatusEnum = z.enum([
  'active',
  'suspended',
  'pending', // Awaiting approval
  'expired',
]);

export const UserEntitlementSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(), // From Keycloak/IdP
  email: z.string().email(), // Verified email from IdP
  organizationId: z.string().uuid(),
  groupIds: z.array(z.string().uuid()), // Assigned permission groups
  directPermissions: z.array(z.string().uuid()).optional(), // Override permissions
  excludedPermissions: z.array(z.string().uuid()).optional(), // Explicitly denied
  status: UserEntitlementStatusEnum.default('active'),
  expiresAt: z.date().optional(), // For temporary access
  lastValidatedAt: z.date().optional(), // Last time entitlements were validated
  metadata: z.record(z.unknown()).optional(),
  assignedBy: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserEntitlement = z.infer<typeof UserEntitlementSchema>;
export type UserEntitlementStatus = z.infer<typeof UserEntitlementStatusEnum>;

// =============================================================================
// Default Group Assignment Schema
// =============================================================================
// Configures which groups are automatically assigned to new users

export const DefaultGroupConditionTypeEnum = z.enum([
  'always', // Always assign this group
  'email_domain', // Based on email domain (e.g., @company.com)
  'email_pattern', // Based on email regex pattern
  'invitation', // Based on invitation type
]);

export const DefaultGroupAssignmentSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  groupId: z.string().uuid(),
  conditionType: DefaultGroupConditionTypeEnum,
  conditionValue: z.string().optional(), // e.g., "company.com" for email_domain
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  createdBy: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DefaultGroupAssignment = z.infer<typeof DefaultGroupAssignmentSchema>;
export type DefaultGroupConditionType = z.infer<typeof DefaultGroupConditionTypeEnum>;

// =============================================================================
// Authorization Request/Response Schemas
// =============================================================================
// Used for API callback authorization checks

export const AuthorizationRequestSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  organizationId: z.string().uuid(),
  resource: z.string(), // e.g., "agents"
  action: z.string(), // e.g., "create"
  resourceId: z.string().optional(), // Specific resource instance
  context: z.record(z.unknown()).optional(), // Additional context
});

export const AuthorizationResponseSchema = z.object({
  allowed: z.boolean(),
  permissions: z.array(z.string()), // List of granted permission codes
  groups: z.array(z.string()), // List of group names
  reason: z.string().optional(), // Explanation if denied
  expiresAt: z.date().optional(), // Cache expiration
  validatedAt: z.date(),
});

export type AuthorizationRequest = z.infer<typeof AuthorizationRequestSchema>;
export type AuthorizationResponse = z.infer<typeof AuthorizationResponseSchema>;

// =============================================================================
// Entitlement Audit Log Schema
// =============================================================================
// Tracks changes to entitlements for compliance

export const EntitlementAuditActionEnum = z.enum([
  'permission_created',
  'permission_updated',
  'permission_deleted',
  'group_created',
  'group_updated',
  'group_deleted',
  'group_permissions_modified',
  'user_assigned_to_group',
  'user_removed_from_group',
  'user_entitlement_modified',
  'user_entitlement_suspended',
  'user_entitlement_activated',
  'default_group_configured',
  'authorization_granted',
  'authorization_denied',
]);

export const EntitlementAuditLogSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  action: EntitlementAuditActionEnum,
  actorId: z.string().uuid(), // Who performed the action
  actorEmail: z.string().email(),
  targetType: z.enum(['permission', 'group', 'user_entitlement', 'authorization']),
  targetId: z.string().uuid(),
  changes: z.record(z.unknown()).optional(), // Before/after values
  metadata: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date(),
});

export type EntitlementAuditLog = z.infer<typeof EntitlementAuditLogSchema>;
export type EntitlementAuditAction = z.infer<typeof EntitlementAuditActionEnum>;

// =============================================================================
// Computed User Permissions Schema
// =============================================================================
// Represents the resolved permissions for a user

export const ComputedUserPermissionsSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  organizationId: z.string().uuid(),
  groups: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      type: PermissionGroupTypeEnum,
    })
  ),
  permissions: z.array(z.string()), // Resolved permission codes
  permissionDetails: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      source: z.enum(['group', 'direct']),
      sourceId: z.string().uuid(),
      sourceName: z.string(),
    })
  ),
  excludedPermissions: z.array(z.string()),
  status: UserEntitlementStatusEnum,
  computedAt: z.date(),
  expiresAt: z.date().optional(),
});

export type ComputedUserPermissions = z.infer<typeof ComputedUserPermissionsSchema>;

// =============================================================================
// System Default Permissions
// =============================================================================
// Define the standard permissions available in the system

export const SYSTEM_PERMISSIONS: Array<{
  code: string;
  name: string;
  category: PermissionCategory;
  action: PermissionAction;
  description: string;
}> = [
  // Agents
  { code: 'agents:create', name: 'Create Agents', category: 'agents', action: 'create', description: 'Create new AI agents' },
  { code: 'agents:read', name: 'View Agents', category: 'agents', action: 'read', description: 'View agent details' },
  { code: 'agents:update', name: 'Update Agents', category: 'agents', action: 'update', description: 'Modify agent settings' },
  { code: 'agents:delete', name: 'Delete Agents', category: 'agents', action: 'delete', description: 'Delete agents' },
  { code: 'agents:execute', name: 'Execute Agents', category: 'agents', action: 'execute', description: 'Start/stop/interact with agents' },
  
  // Models
  { code: 'models:create', name: 'Pull Models', category: 'models', action: 'create', description: 'Pull new models from Ollama' },
  { code: 'models:read', name: 'View Models', category: 'models', action: 'read', description: 'View available models' },
  { code: 'models:delete', name: 'Delete Models', category: 'models', action: 'delete', description: 'Remove models' },
  
  // Tasks
  { code: 'tasks:create', name: 'Create Tasks', category: 'tasks', action: 'create', description: 'Create new tasks' },
  { code: 'tasks:read', name: 'View Tasks', category: 'tasks', action: 'read', description: 'View task details' },
  { code: 'tasks:update', name: 'Update Tasks', category: 'tasks', action: 'update', description: 'Modify tasks' },
  { code: 'tasks:delete', name: 'Delete Tasks', category: 'tasks', action: 'delete', description: 'Delete tasks' },
  
  // Audit Logs
  { code: 'audit:read', name: 'View Audit Logs', category: 'audit', action: 'read', description: 'View audit logs' },
  { code: 'audit:export', name: 'Export Audit Logs', category: 'audit', action: 'export', description: 'Export audit data' },
  
  // Connectors
  { code: 'connectors:create', name: 'Create Connectors', category: 'connectors', action: 'create', description: 'Create new connectors' },
  { code: 'connectors:read', name: 'View Connectors', category: 'connectors', action: 'read', description: 'View connectors' },
  { code: 'connectors:update', name: 'Update Connectors', category: 'connectors', action: 'update', description: 'Modify connectors' },
  { code: 'connectors:delete', name: 'Delete Connectors', category: 'connectors', action: 'delete', description: 'Delete connectors' },
  
  // Settings
  { code: 'settings:read', name: 'View Settings', category: 'settings', action: 'read', description: 'View organization settings' },
  { code: 'settings:update', name: 'Update Settings', category: 'settings', action: 'update', description: 'Modify settings' },
  
  // Users (Entitlements)
  { code: 'users:read', name: 'View Users', category: 'users', action: 'read', description: 'View user list and details' },
  { code: 'users:manage', name: 'Manage Users', category: 'users', action: 'manage', description: 'Manage user entitlements' },
  
  // Groups
  { code: 'groups:create', name: 'Create Groups', category: 'groups', action: 'create', description: 'Create permission groups' },
  { code: 'groups:read', name: 'View Groups', category: 'groups', action: 'read', description: 'View permission groups' },
  { code: 'groups:update', name: 'Update Groups', category: 'groups', action: 'update', description: 'Modify permission groups' },
  { code: 'groups:delete', name: 'Delete Groups', category: 'groups', action: 'delete', description: 'Delete permission groups' },
  { code: 'groups:assign', name: 'Assign Groups', category: 'groups', action: 'assign', description: 'Assign users to groups' },
  
  // Permissions
  { code: 'permissions:read', name: 'View Permissions', category: 'permissions', action: 'read', description: 'View available permissions' },
  { code: 'permissions:manage', name: 'Manage Permissions', category: 'permissions', action: 'manage', description: 'Create/modify custom permissions' },
  
  // Organization
  { code: 'organization:read', name: 'View Organization', category: 'organization', action: 'read', description: 'View organization details' },
  { code: 'organization:update', name: 'Update Organization', category: 'organization', action: 'update', description: 'Modify organization settings' },
  { code: 'organization:manage', name: 'Manage Organization', category: 'organization', action: 'manage', description: 'Full organization management' },
  
  // API
  { code: 'api:read', name: 'API Read Access', category: 'api', action: 'read', description: 'Read-only API access' },
  { code: 'api:manage', name: 'API Management', category: 'api', action: 'manage', description: 'Manage API keys and webhooks' },
];

// =============================================================================
// System Default Groups
// =============================================================================

export const SYSTEM_GROUPS: Array<{
  name: string;
  type: PermissionGroupType;
  description: string;
  permissions: string[]; // Permission codes
  isDefault: boolean;
  color: string;
}> = [
  {
    name: 'Admin',
    type: 'system',
    description: 'Full administrative access to all features',
    permissions: SYSTEM_PERMISSIONS.map((p) => p.code),
    isDefault: false,
    color: '#ef4444',
  },
  {
    name: 'Developer',
    type: 'system',
    description: 'Create and manage agents, models, and tasks',
    permissions: [
      'agents:create', 'agents:read', 'agents:update', 'agents:delete', 'agents:execute',
      'models:create', 'models:read', 'models:delete',
      'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
      'connectors:create', 'connectors:read', 'connectors:update', 'connectors:delete',
      'audit:read',
      'settings:read',
    ],
    isDefault: false,
    color: '#6366f1',
  },
  {
    name: 'Operator',
    type: 'system',
    description: 'Execute agents and view system status',
    permissions: [
      'agents:read', 'agents:execute',
      'models:read',
      'tasks:read', 'tasks:update',
      'connectors:read',
      'audit:read',
    ],
    isDefault: false,
    color: '#10b981',
  },
  {
    name: 'Viewer',
    type: 'system',
    description: 'Read-only access to view resources',
    permissions: [
      'agents:read',
      'models:read',
      'tasks:read',
      'connectors:read',
      'audit:read',
    ],
    isDefault: true, // New users get this by default
    color: '#6b7280',
  },
];

