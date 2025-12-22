import { apiClient } from './api';

// =============================================================================
// Types
// =============================================================================

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  action: string;
  isSystem: boolean;
  isActive: boolean;
}

export interface PermissionGroup {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: 'system' | 'custom' | 'default';
  permissions: string[];
  permissionDetails?: Permission[];
  isDefault: boolean;
  priority: number;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserEntitlement {
  id: string;
  userId: string;
  email: string;
  organizationId: string;
  groupIds: string[];
  groups?: { id: string; name: string; color: string }[];
  directPermissions?: string[];
  excludedPermissions?: string[];
  status: 'active' | 'suspended' | 'pending' | 'expired';
  expiresAt?: string;
  lastValidatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComputedUserPermissions {
  userId: string;
  email: string;
  organizationId: string;
  groups: { id: string; name: string; type: string }[];
  permissions: string[];
  permissionDetails: {
    code: string;
    name: string;
    source: 'group' | 'direct';
    sourceId: string;
    sourceName: string;
  }[];
  excludedPermissions: string[];
  status: string;
  computedAt: string;
  expiresAt?: string;
}

export interface DefaultGroupAssignment {
  id: string;
  organizationId: string;
  groupId: string;
  conditionType: 'always' | 'email_domain' | 'email_pattern' | 'invitation';
  conditionValue?: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorizationRequest {
  userId: string;
  email: string;
  organizationId: string;
  resource: string;
  action: string;
  resourceId?: string;
  context?: Record<string, unknown>;
}

export interface AuthorizationResponse {
  allowed: boolean;
  permissions: string[];
  groups: string[];
  reason?: string;
  expiresAt?: string;
  validatedAt: string;
}

// =============================================================================
// Permissions API
// =============================================================================

export const permissionsService = {
  list: async (category?: string): Promise<Permission[]> => {
    const url = category
      ? `/entitlements/permissions?category=${category}`
      : '/entitlements/permissions';
    const response = await apiClient.get<Permission[]>(url);
    return response.data;
  },

  getById: async (id: string): Promise<Permission> => {
    const response = await apiClient.get<Permission>(
      `/entitlements/permissions/${id}`,
    );
    return response.data;
  },

  getByCode: async (code: string): Promise<Permission> => {
    const response = await apiClient.get<Permission>(
      `/entitlements/permissions/code/${code}`,
    );
    return response.data;
  },

  create: async (data: {
    code: string;
    name: string;
    description?: string;
    category: string;
    action: string;
  }): Promise<Permission> => {
    const response = await apiClient.post<Permission>(
      '/entitlements/permissions',
      data,
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/entitlements/permissions/${id}`);
  },
};

// =============================================================================
// Groups API
// =============================================================================

export const groupsService = {
  list: async (): Promise<PermissionGroup[]> => {
    const response = await apiClient.get<PermissionGroup[]>(
      '/entitlements/groups',
    );
    return response.data;
  },

  getById: async (id: string): Promise<PermissionGroup> => {
    const response = await apiClient.get<PermissionGroup>(
      `/entitlements/groups/${id}`,
    );
    return response.data;
  },

  create: async (data: {
    name: string;
    description?: string;
    permissionIds: string[];
    isDefault?: boolean;
    color?: string;
    icon?: string;
  }): Promise<PermissionGroup> => {
    const response = await apiClient.post<PermissionGroup>(
      '/entitlements/groups',
      data,
    );
    return response.data;
  },

  update: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      isDefault?: boolean;
      color?: string;
      icon?: string;
    },
  ): Promise<PermissionGroup> => {
    const response = await apiClient.put<PermissionGroup>(
      `/entitlements/groups/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/entitlements/groups/${id}`);
  },

  addPermissions: async (
    groupId: string,
    permissionIds: string[],
  ): Promise<PermissionGroup> => {
    const response = await apiClient.post<PermissionGroup>(
      `/entitlements/groups/${groupId}/permissions`,
      { permissionIds },
    );
    return response.data;
  },

  removePermissions: async (
    groupId: string,
    permissionIds: string[],
  ): Promise<PermissionGroup> => {
    const response = await apiClient.delete<PermissionGroup>(
      `/entitlements/groups/${groupId}/permissions`,
      { data: { permissionIds } },
    );
    return response.data;
  },
};

// =============================================================================
// User Entitlements API
// =============================================================================

export const userEntitlementsService = {
  list: async (): Promise<UserEntitlement[]> => {
    const response = await apiClient.get<UserEntitlement[]>(
      '/entitlements/users',
    );
    return response.data;
  },

  create: async (data: {
    email: string;
    groupIds?: string[];
    directPermissions?: string[];
    status?: 'active' | 'suspended' | 'pending' | 'expired';
    expiresAt?: string;
    metadata?: Record<string, unknown>;
  }): Promise<UserEntitlement> => {
    const response = await apiClient.post<UserEntitlement>(
      '/entitlements/users',
      {
        userId: data.email, // Use email as userId for new users
        ...data,
      },
    );
    return response.data;
  },

  getMyEntitlements: async (): Promise<{
    entitlement: UserEntitlement;
    computed: ComputedUserPermissions;
  }> => {
    const response = await apiClient.get<{
      entitlement: UserEntitlement;
      computed: ComputedUserPermissions;
    }>('/entitlements/users/me');
    return response.data;
  },

  getById: async (id: string): Promise<UserEntitlement> => {
    const response = await apiClient.get<UserEntitlement>(
      `/entitlements/users/${id}`,
    );
    return response.data;
  },

  getPermissions: async (
    id: string,
    organizationId?: string,
  ): Promise<ComputedUserPermissions> => {
    const url = organizationId
      ? `/entitlements/users/${id}/permissions?organizationId=${organizationId}`
      : `/entitlements/users/${id}/permissions`;
    const response = await apiClient.get<ComputedUserPermissions>(url);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      status?: 'active' | 'suspended' | 'pending' | 'expired';
      expiresAt?: string;
    },
  ): Promise<UserEntitlement> => {
    const response = await apiClient.put<UserEntitlement>(
      `/entitlements/users/${id}`,
      data,
    );
    return response.data;
  },

  assignToGroups: async (
    id: string,
    groupIds: string[],
  ): Promise<UserEntitlement> => {
    const response = await apiClient.post<UserEntitlement>(
      `/entitlements/users/${id}/groups`,
      {
        groupIds,
      },
    );
    return response.data;
  },

  setGroups: async (
    id: string,
    groupIds: string[],
  ): Promise<UserEntitlement> => {
    const response = await apiClient.put<UserEntitlement>(
      `/entitlements/users/${id}/groups`,
      {
        groupIds,
      },
    );
    return response.data;
  },

  removeFromGroups: async (
    id: string,
    groupIds: string[],
  ): Promise<UserEntitlement> => {
    const response = await apiClient.delete<UserEntitlement>(
      `/entitlements/users/${id}/groups`,
      {
        data: { groupIds },
      },
    );
    return response.data;
  },

  suspend: async (id: string): Promise<UserEntitlement> => {
    const response = await apiClient.post<UserEntitlement>(
      `/entitlements/users/${id}/suspend`,
    );
    return response.data;
  },

  activate: async (id: string): Promise<UserEntitlement> => {
    const response = await apiClient.post<UserEntitlement>(
      `/entitlements/users/${id}/activate`,
    );
    return response.data;
  },
};

// =============================================================================
// Default Groups API
// =============================================================================

export const defaultGroupsService = {
  list: async (): Promise<DefaultGroupAssignment[]> => {
    const response = await apiClient.get<DefaultGroupAssignment[]>(
      '/entitlements/default-groups',
    );
    return response.data;
  },

  create: async (data: {
    groupId: string;
    conditionType: 'always' | 'email_domain' | 'email_pattern' | 'invitation';
    conditionValue?: string;
    priority?: number;
  }): Promise<DefaultGroupAssignment> => {
    const response = await apiClient.post<DefaultGroupAssignment>(
      '/entitlements/default-groups',
      data,
    );
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<{
      conditionType: 'always' | 'email_domain' | 'email_pattern' | 'invitation';
      conditionValue?: string;
      priority?: number;
      isActive?: boolean;
    }>,
  ): Promise<DefaultGroupAssignment> => {
    const response = await apiClient.put<DefaultGroupAssignment>(
      `/entitlements/default-groups/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/entitlements/default-groups/${id}`);
  },
};

// =============================================================================
// Authorization API
// =============================================================================

export const authorizationService = {
  authorize: async (
    request: AuthorizationRequest,
  ): Promise<AuthorizationResponse> => {
    const response = await apiClient.post<AuthorizationResponse>(
      '/entitlements/authorize',
      request,
    );
    return response.data;
  },

  validate: async (data: {
    userId: string;
    email: string;
    organizationId: string;
  }): Promise<{ valid: boolean }> => {
    const response = await apiClient.post<{ valid: boolean }>(
      '/entitlements/validate',
      data,
    );
    return response.data;
  },

  provision: async (data: {
    userId: string;
    email: string;
    organizationId: string;
  }): Promise<UserEntitlement> => {
    const response = await apiClient.post<UserEntitlement>(
      '/entitlements/provision',
      data,
    );
    return response.data;
  },
};

// =============================================================================
// Convenience Hooks
// =============================================================================

/**
 * Check if the current user has a specific permission
 * Use this in React components for conditional rendering
 */
export const useHasPermission = (
  computed: ComputedUserPermissions | null,
  permission: string,
): boolean => {
  if (!computed) return false;
  return computed.permissions.includes(permission);
};

/**
 * Check if the current user has all specified permissions
 */
export const useHasAllPermissions = (
  computed: ComputedUserPermissions | null,
  permissions: string[],
): boolean => {
  if (!computed) return false;
  return permissions.every((p) => computed.permissions.includes(p));
};

/**
 * Check if the current user has any of the specified permissions
 */
export const useHasAnyPermission = (
  computed: ComputedUserPermissions | null,
  permissions: string[],
): boolean => {
  if (!computed) return false;
  return permissions.some((p) => computed.permissions.includes(p));
};
