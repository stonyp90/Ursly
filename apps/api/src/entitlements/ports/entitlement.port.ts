import {
  Permission,
  PermissionGroup,
  UserEntitlement,
  DefaultGroupAssignment,
  ComputedUserPermissions,
  AuthorizationRequest,
  AuthorizationResponse,
  EntitlementAuditLog,
} from '@ursly/access-control';

// =============================================================================
// Permission Repository Port
// =============================================================================

export interface IPermissionRepository {
  findById(id: string): Promise<Permission | null>;
  findByCode(code: string): Promise<Permission | null>;
  findByCategory(category: string): Promise<Permission[]>;
  findAll(organizationId?: string): Promise<Permission[]>;
  findByIds(ids: string[]): Promise<Permission[]>;
  create(
    permission: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Permission>;
  update(id: string, updates: Partial<Permission>): Promise<Permission | null>;
  delete(id: string): Promise<boolean>;
  seedSystemPermissions(): Promise<void>;
}

export const PERMISSION_REPOSITORY = Symbol('IPermissionRepository');

// =============================================================================
// Permission Group Repository Port
// =============================================================================

export interface IPermissionGroupRepository {
  findById(id: string): Promise<PermissionGroup | null>;
  findByName(
    organizationId: string,
    name: string,
  ): Promise<PermissionGroup | null>;
  findByOrganization(organizationId: string): Promise<PermissionGroup[]>;
  findDefaultGroups(organizationId: string): Promise<PermissionGroup[]>;
  findSystemGroups(): Promise<PermissionGroup[]>;
  create(
    group: Omit<PermissionGroup, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PermissionGroup>;
  update(
    id: string,
    updates: Partial<PermissionGroup>,
  ): Promise<PermissionGroup | null>;
  delete(id: string): Promise<boolean>;
  addPermissions(
    groupId: string,
    permissionIds: string[],
  ): Promise<PermissionGroup | null>;
  removePermissions(
    groupId: string,
    permissionIds: string[],
  ): Promise<PermissionGroup | null>;
  seedSystemGroups(organizationId: string): Promise<void>;
}

export const PERMISSION_GROUP_REPOSITORY = Symbol('IPermissionGroupRepository');

// =============================================================================
// User Entitlement Repository Port
// =============================================================================

export interface IUserEntitlementRepository {
  findById(id: string): Promise<UserEntitlement | null>;
  findByUserId(
    userId: string,
    organizationId: string,
  ): Promise<UserEntitlement | null>;
  findByEmail(
    email: string,
    organizationId: string,
  ): Promise<UserEntitlement | null>;
  findByOrganization(organizationId: string): Promise<UserEntitlement[]>;
  findByGroup(groupId: string): Promise<UserEntitlement[]>;
  create(
    entitlement: Omit<UserEntitlement, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<UserEntitlement>;
  update(
    id: string,
    updates: Partial<UserEntitlement>,
  ): Promise<UserEntitlement | null>;
  delete(id: string): Promise<boolean>;
  assignToGroups(
    id: string,
    groupIds: string[],
  ): Promise<UserEntitlement | null>;
  removeFromGroups(
    id: string,
    groupIds: string[],
  ): Promise<UserEntitlement | null>;
  setGroups(id: string, groupIds: string[]): Promise<UserEntitlement | null>;
  addDirectPermissions(
    id: string,
    permissionIds: string[],
  ): Promise<UserEntitlement | null>;
  removeDirectPermissions(
    id: string,
    permissionIds: string[],
  ): Promise<UserEntitlement | null>;
  addExcludedPermissions(
    id: string,
    permissionIds: string[],
  ): Promise<UserEntitlement | null>;
  removeExcludedPermissions(
    id: string,
    permissionIds: string[],
  ): Promise<UserEntitlement | null>;
}

export const USER_ENTITLEMENT_REPOSITORY = Symbol('IUserEntitlementRepository');

// =============================================================================
// Default Group Assignment Repository Port
// =============================================================================

export interface IDefaultGroupAssignmentRepository {
  findById(id: string): Promise<DefaultGroupAssignment | null>;
  findByOrganization(organizationId: string): Promise<DefaultGroupAssignment[]>;
  findActiveByOrganization(
    organizationId: string,
  ): Promise<DefaultGroupAssignment[]>;
  create(
    assignment: Omit<DefaultGroupAssignment, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<DefaultGroupAssignment>;
  update(
    id: string,
    updates: Partial<DefaultGroupAssignment>,
  ): Promise<DefaultGroupAssignment | null>;
  delete(id: string): Promise<boolean>;
}

export const DEFAULT_GROUP_ASSIGNMENT_REPOSITORY = Symbol(
  'IDefaultGroupAssignmentRepository',
);

// =============================================================================
// Entitlement Audit Log Repository Port
// =============================================================================

export interface IEntitlementAuditLogRepository {
  findById(id: string): Promise<EntitlementAuditLog | null>;
  findByOrganization(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      action?: string;
      actorId?: string;
      targetType?: string;
    },
  ): Promise<EntitlementAuditLog[]>;
  create(
    log: Omit<EntitlementAuditLog, 'id' | 'createdAt'>,
  ): Promise<EntitlementAuditLog>;
  count(
    organizationId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      action?: string;
    },
  ): Promise<number>;
}

export const ENTITLEMENT_AUDIT_LOG_REPOSITORY = Symbol(
  'IEntitlementAuditLogRepository',
);

// =============================================================================
// Authorization Service Port
// =============================================================================

export interface IAuthorizationService {
  /**
   * Check if a user is authorized to perform an action
   */
  authorize(request: AuthorizationRequest): Promise<AuthorizationResponse>;

  /**
   * Get computed permissions for a user
   */
  getComputedPermissions(
    userId: string,
    organizationId: string,
  ): Promise<ComputedUserPermissions | null>;

  /**
   * Validate user entitlements (check email, status, expiration)
   */
  validateEntitlements(
    userId: string,
    email: string,
    organizationId: string,
  ): Promise<boolean>;

  /**
   * Provision entitlements for a new user based on default groups
   */
  provisionNewUser(
    userId: string,
    email: string,
    organizationId: string,
  ): Promise<UserEntitlement>;

  /**
   * Refresh/recalculate cached permissions for a user
   */
  refreshPermissions(
    userId: string,
    organizationId: string,
  ): Promise<ComputedUserPermissions>;

  /**
   * Bootstrap admin access for a user (development/setup only)
   */
  bootstrapAdminUser(
    userId: string,
    email: string,
    organizationId: string,
  ): Promise<UserEntitlement>;
}

export const AUTHORIZATION_SERVICE = Symbol('IAuthorizationService');
