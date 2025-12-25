import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  IPermissionRepository,
  IPermissionGroupRepository,
  IUserEntitlementRepository,
  IDefaultGroupAssignmentRepository,
  IAuthorizationService,
  PERMISSION_REPOSITORY,
  PERMISSION_GROUP_REPOSITORY,
  USER_ENTITLEMENT_REPOSITORY,
  DEFAULT_GROUP_ASSIGNMENT_REPOSITORY,
  AUTHORIZATION_SERVICE,
} from '../ports/entitlement.port';
import {
  RequirePermissions,
  RequireAllPermissions,
  SkipEntitlementCheck,
} from '../guards/entitlement.guard';

// =============================================================================
// DTOs
// =============================================================================

class CreateGroupDto {
  name: string;
  description?: string;
  permissionIds: string[];
  isDefault?: boolean;
  color?: string;
  icon?: string;
}

class UpdateGroupDto {
  name?: string;
  description?: string;
  isDefault?: boolean;
  color?: string;
  icon?: string;
}

class AssignUserToGroupsDto {
  groupIds: string[];
}

class CreateDefaultAssignmentDto {
  groupId: string;
  conditionType: 'always' | 'email_domain' | 'email_pattern' | 'invitation';
  conditionValue?: string;
  priority?: number;
}

class UpdateUserEntitlementDto {
  status?: 'active' | 'suspended' | 'pending' | 'expired';
  expiresAt?: string;
}

class CreateUserEntitlementDto {
  userId: string;
  email: string;
  groupIds?: string[];
  directPermissions?: string[];
  status?: 'active' | 'suspended' | 'pending' | 'expired';
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

class CreatePermissionDto {
  code: string;
  name: string;
  description?: string;
  category: string;
  action: string;
  metadata?: Record<string, unknown>;
}

class UpdatePermissionDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

class DirectPermissionsDto {
  permissionIds: string[];
}

class ExcludedPermissionsDto {
  permissionIds: string[];
}

// =============================================================================
// Permissions Controller
// =============================================================================

@ApiTags('Entitlements - Permissions')
@ApiBearerAuth()
@Controller('entitlements/permissions')
export class PermissionsController {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all permissions' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  @RequirePermissions('permissions:read')
  async listPermissions(@Query('category') category?: string) {
    if (category) {
      return this.permissionRepository.findByCategory(category);
    }
    return this.permissionRepository.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permission by ID' })
  @RequirePermissions('permissions:read')
  async getPermission(@Param('id') id: string) {
    return this.permissionRepository.findById(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get permission by code' })
  @RequirePermissions('permissions:read')
  async getPermissionByCode(@Param('code') code: string) {
    return this.permissionRepository.findByCode(code);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('permissions:manage')
  async createPermission(@Body() dto: CreatePermissionDto) {
    // Validate code format
    if (!/^[a-z]+:[a-z]+$/.test(dto.code)) {
      throw new Error(
        'Permission code must be in format: resource:action (lowercase)',
      );
    }

    // Check if code already exists
    const existing = await this.permissionRepository.findByCode(dto.code);
    if (existing) {
      throw new Error(`Permission with code '${dto.code}' already exists`);
    }

    return this.permissionRepository.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      category: dto.category as any,
      action: dto.action as any,
      isSystem: false,
      isActive: true,
      metadata: dto.metadata,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiResponse({ status: 200, description: 'Permission updated successfully' })
  @RequirePermissions('permissions:manage')
  async updatePermission(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new Error('Permission not found');
    }

    if (permission.isSystem) {
      throw new Error('Cannot modify system permissions');
    }

    return this.permissionRepository.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiResponse({ status: 204, description: 'Permission deleted successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('permissions:manage')
  async deletePermission(@Param('id') id: string) {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new Error('Permission not found');
    }

    if (permission.isSystem) {
      throw new Error('Cannot delete system permissions');
    }

    return this.permissionRepository.delete(id);
  }
}

// =============================================================================
// Groups Controller
// =============================================================================

@ApiTags('Entitlements - Groups')
@ApiBearerAuth()
@Controller('entitlements/groups')
export class GroupsController {
  constructor(
    @Inject(PERMISSION_GROUP_REPOSITORY)
    private readonly groupRepository: IPermissionGroupRepository,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    @Inject(AUTHORIZATION_SERVICE)
    private readonly authorizationService: IAuthorizationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all groups for the organization' })
  @ApiResponse({ status: 200, description: 'List of groups' })
  @RequirePermissions('groups:read')
  async listGroups(@Req() req: Request) {
    const organizationId = req.entitlementUser?.organizationId || 'default';
    return this.groupRepository.findByOrganization(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group by ID with permissions' })
  @RequirePermissions('groups:read')
  async getGroup(@Param('id') id: string) {
    const group = await this.groupRepository.findById(id);
    if (!group) return null;

    // Fetch permission details
    const permissions = await this.permissionRepository.findByIds(
      group.permissions,
    );

    return {
      ...group,
      permissionDetails: permissions,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('groups:create')
  async createGroup(@Req() req: Request, @Body() dto: CreateGroupDto) {
    const organizationId = req.entitlementUser?.organizationId || 'default';
    const createdBy = req.entitlementUser?.id;

    return this.groupRepository.create({
      organizationId,
      name: dto.name,
      description: dto.description,
      type: 'custom',
      permissions: dto.permissionIds,
      isDefault: dto.isDefault ?? false,
      priority: 0,
      color: dto.color,
      icon: dto.icon,
      createdBy,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a group' })
  @RequirePermissions('groups:update')
  async updateGroup(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupRepository.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a group' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('groups:delete')
  async deleteGroup(@Param('id') id: string) {
    // Check if it's a system group
    const group = await this.groupRepository.findById(id);
    if (group?.type === 'system') {
      throw new Error('Cannot delete system groups');
    }
    return this.groupRepository.delete(id);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Add permissions to a group' })
  @RequirePermissions('groups:update')
  async addPermissions(
    @Param('id') id: string,
    @Body() body: { permissionIds: string[] },
  ) {
    const group = await this.groupRepository.addPermissions(
      id,
      body.permissionIds,
    );

    // Invalidate cache for all users in this group
    if (group) {
      await this.authorizationService.refreshPermissions(
        id,
        group.organizationId,
      );
    }

    return group;
  }

  @Delete(':id/permissions')
  @ApiOperation({ summary: 'Remove permissions from a group' })
  @RequirePermissions('groups:update')
  async removePermissions(
    @Param('id') id: string,
    @Body() body: { permissionIds: string[] },
  ) {
    return this.groupRepository.removePermissions(id, body.permissionIds);
  }
}

// =============================================================================
// User Entitlements Controller
// =============================================================================

@ApiTags('Entitlements - Users')
@ApiBearerAuth()
@Controller('entitlements/users')
export class UserEntitlementsController {
  constructor(
    @Inject(USER_ENTITLEMENT_REPOSITORY)
    private readonly entitlementRepository: IUserEntitlementRepository,
    @Inject(AUTHORIZATION_SERVICE)
    private readonly authorizationService: IAuthorizationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all user entitlements for the organization' })
  @RequirePermissions('users:read')
  async listUsers(@Req() req: Request) {
    const organizationId = req.entitlementUser?.organizationId || 'default';
    return this.entitlementRepository.findByOrganization(organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user entitlement' })
  @ApiResponse({
    status: 201,
    description: 'User entitlement created successfully',
  })
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('users:manage')
  async createUserEntitlement(
    @Req() req: Request,
    @Body() dto: CreateUserEntitlementDto,
  ) {
    const organizationId = req.entitlementUser?.organizationId || 'default';
    const assignedBy = req.entitlementUser?.id;

    // Check if user already has entitlements in this organization
    const existing = await this.entitlementRepository.findByUserId(
      dto.userId,
      organizationId,
    );
    if (existing) {
      throw new Error(`User already has entitlements in this organization`);
    }

    const entitlement = await this.entitlementRepository.create({
      userId: dto.userId,
      email: dto.email,
      organizationId,
      groupIds: dto.groupIds || [],
      directPermissions: dto.directPermissions || [],
      excludedPermissions: [],
      status: dto.status || 'active',
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      metadata: dto.metadata,
      assignedBy,
    });

    // Compute initial permissions
    await this.authorizationService.refreshPermissions(
      dto.userId,
      organizationId,
    );

    return entitlement;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user entitlements and permissions' })
  async getMyEntitlements(@Req() req: Request) {
    const user = req.entitlementUser;
    if (!user) {
      return null;
    }

    const computed = await this.authorizationService.getComputedPermissions(
      user.id,
      user.organizationId,
    );

    return {
      entitlement: await this.entitlementRepository.findByUserId(
        user.id,
        user.organizationId,
      ),
      computed,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user entitlement by ID' })
  @RequirePermissions('users:read')
  async getUser(@Param('id') id: string) {
    return this.entitlementRepository.findById(id);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Get computed permissions for a user' })
  @RequirePermissions('users:read')
  async getUserPermissions(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
  ) {
    const entitlement = await this.entitlementRepository.findById(id);
    if (!entitlement) return null;

    return this.authorizationService.getComputedPermissions(
      entitlement.userId,
      organizationId || entitlement.organizationId,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user entitlement' })
  @RequirePermissions('users:manage')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserEntitlementDto,
  ) {
    const updates: any = {};
    if (dto.status) updates.status = dto.status;
    if (dto.expiresAt) updates.expiresAt = new Date(dto.expiresAt);

    const entitlement = await this.entitlementRepository.update(id, updates);

    // Invalidate cache
    if (entitlement) {
      this.authorizationService.refreshPermissions(
        entitlement.userId,
        entitlement.organizationId,
      );
    }

    return entitlement;
  }

  @Post(':id/groups')
  @ApiOperation({ summary: 'Add user to groups (additive)' })
  @RequirePermissions('groups:assign')
  async assignToGroups(
    @Param('id') id: string,
    @Body() dto: AssignUserToGroupsDto,
  ) {
    const entitlement = await this.entitlementRepository.assignToGroups(
      id,
      dto.groupIds,
    );

    // Invalidate cache
    if (entitlement) {
      await this.authorizationService.refreshPermissions(
        entitlement.userId,
        entitlement.organizationId,
      );
    }

    return entitlement;
  }

  @Put(':id/groups')
  @ApiOperation({ summary: 'Set user groups (replaces all existing groups)' })
  @RequirePermissions('groups:assign')
  async setGroups(@Param('id') id: string, @Body() dto: AssignUserToGroupsDto) {
    const entitlement = await this.entitlementRepository.setGroups(
      id,
      dto.groupIds,
    );

    // Invalidate cache
    if (entitlement) {
      await this.authorizationService.refreshPermissions(
        entitlement.userId,
        entitlement.organizationId,
      );
    }

    return entitlement;
  }

  @Delete(':id/groups')
  @ApiOperation({ summary: 'Remove user from groups' })
  @RequirePermissions('groups:assign')
  async removeFromGroups(
    @Param('id') id: string,
    @Body() dto: AssignUserToGroupsDto,
  ) {
    const entitlement = await this.entitlementRepository.removeFromGroups(
      id,
      dto.groupIds,
    );

    // Invalidate cache
    if (entitlement) {
      await this.authorizationService.refreshPermissions(
        entitlement.userId,
        entitlement.organizationId,
      );
    }

    return entitlement;
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend user entitlements' })
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('users:manage')
  async suspendUser(@Param('id') id: string) {
    return this.entitlementRepository.update(id, { status: 'suspended' });
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate user entitlements' })
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('users:manage')
  async activateUser(@Param('id') id: string) {
    return this.entitlementRepository.update(id, { status: 'active' });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user entitlement' })
  @ApiResponse({
    status: 204,
    description: 'User entitlement deleted successfully',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('users:manage')
  async deleteUserEntitlement(@Param('id') id: string) {
    const entitlement = await this.entitlementRepository.findById(id);
    if (!entitlement) {
      throw new Error('User entitlement not found');
    }
    return this.entitlementRepository.delete(id);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Add direct permissions to a user' })
  @ApiResponse({ status: 200, description: 'Permissions added successfully' })
  @RequirePermissions('users:manage')
  async addDirectPermissions(
    @Param('id') id: string,
    @Body() dto: DirectPermissionsDto,
  ) {
    const entitlement = await this.entitlementRepository.addDirectPermissions(
      id,
      dto.permissionIds,
    );

    if (entitlement) {
      await this.authorizationService.refreshPermissions(
        entitlement.userId,
        entitlement.organizationId,
      );
    }

    return entitlement;
  }

  @Delete(':id/permissions')
  @ApiOperation({ summary: 'Remove direct permissions from a user' })
  @ApiResponse({ status: 200, description: 'Permissions removed successfully' })
  @RequirePermissions('users:manage')
  async removeDirectPermissions(
    @Param('id') id: string,
    @Body() dto: DirectPermissionsDto,
  ) {
    const entitlement =
      await this.entitlementRepository.removeDirectPermissions(
        id,
        dto.permissionIds,
      );

    if (entitlement) {
      await this.authorizationService.refreshPermissions(
        entitlement.userId,
        entitlement.organizationId,
      );
    }

    return entitlement;
  }

  @Post(':id/excluded-permissions')
  @ApiOperation({
    summary: 'Add excluded permissions to a user (deny specific permissions)',
  })
  @ApiResponse({
    status: 200,
    description: 'Excluded permissions added successfully',
  })
  @RequirePermissions('users:manage')
  async addExcludedPermissions(
    @Param('id') id: string,
    @Body() dto: ExcludedPermissionsDto,
  ) {
    const entitlement = await this.entitlementRepository.addExcludedPermissions(
      id,
      dto.permissionIds,
    );

    if (entitlement) {
      await this.authorizationService.refreshPermissions(
        entitlement.userId,
        entitlement.organizationId,
      );
    }

    return entitlement;
  }

  @Delete(':id/excluded-permissions')
  @ApiOperation({ summary: 'Remove excluded permissions from a user' })
  @ApiResponse({
    status: 200,
    description: 'Excluded permissions removed successfully',
  })
  @RequirePermissions('users:manage')
  async removeExcludedPermissions(
    @Param('id') id: string,
    @Body() dto: ExcludedPermissionsDto,
  ) {
    const entitlement =
      await this.entitlementRepository.removeExcludedPermissions(
        id,
        dto.permissionIds,
      );

    if (entitlement) {
      await this.authorizationService.refreshPermissions(
        entitlement.userId,
        entitlement.organizationId,
      );
    }

    return entitlement;
  }
}

// =============================================================================
// Default Groups Controller
// =============================================================================

@ApiTags('Entitlements - Default Groups')
@ApiBearerAuth()
@Controller('entitlements/default-groups')
export class DefaultGroupsController {
  constructor(
    @Inject(DEFAULT_GROUP_ASSIGNMENT_REPOSITORY)
    private readonly defaultGroupRepository: IDefaultGroupAssignmentRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List default group assignments' })
  @RequirePermissions('groups:read')
  async listDefaultGroups(@Req() req: Request) {
    const organizationId = req.entitlementUser?.organizationId || 'default';
    return this.defaultGroupRepository.findByOrganization(organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a default group assignment' })
  @HttpCode(HttpStatus.CREATED)
  @RequireAllPermissions('groups:update', 'groups:assign')
  async createDefaultGroup(
    @Req() req: Request,
    @Body() dto: CreateDefaultAssignmentDto,
  ) {
    const organizationId = req.entitlementUser?.organizationId || 'default';
    const createdBy = req.entitlementUser?.id;

    return this.defaultGroupRepository.create({
      organizationId,
      groupId: dto.groupId,
      conditionType: dto.conditionType,
      conditionValue: dto.conditionValue,
      priority: dto.priority ?? 0,
      isActive: true,
      createdBy,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a default group assignment' })
  @RequirePermissions('groups:update')
  async updateDefaultGroup(
    @Param('id') id: string,
    @Body() dto: Partial<CreateDefaultAssignmentDto>,
  ) {
    return this.defaultGroupRepository.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a default group assignment' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('groups:delete')
  async deleteDefaultGroup(@Param('id') id: string) {
    return this.defaultGroupRepository.delete(id);
  }
}

// =============================================================================
// Authorization Callback Controller
// =============================================================================

@ApiTags('Entitlements - Authorization')
@ApiBearerAuth()
@Controller('entitlements/authorize')
export class AuthorizationController {
  constructor(
    @Inject(AUTHORIZATION_SERVICE)
    private readonly authorizationService: IAuthorizationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Authorization callback endpoint' })
  @ApiResponse({ status: 200, description: 'Authorization result' })
  @HttpCode(HttpStatus.OK)
  async authorize(
    @Body()
    request: {
      userId: string;
      email: string;
      organizationId: string;
      resource: string;
      action: string;
      resourceId?: string;
      context?: Record<string, unknown>;
    },
  ) {
    return this.authorizationService.authorize({
      userId: request.userId,
      email: request.email,
      organizationId: request.organizationId,
      resource: request.resource,
      action: request.action,
      resourceId: request.resourceId,
      context: request.context,
    });
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate user entitlements' })
  @HttpCode(HttpStatus.OK)
  async validateEntitlements(
    @Body() request: { userId: string; email: string; organizationId: string },
  ) {
    const isValid = await this.authorizationService.validateEntitlements(
      request.userId,
      request.email,
      request.organizationId,
    );

    return { valid: isValid };
  }

  @Post('provision')
  @ApiOperation({ summary: 'Provision entitlements for a new user' })
  @HttpCode(HttpStatus.CREATED)
  async provisionUser(
    @Body() request: { userId: string; email: string; organizationId: string },
  ) {
    return this.authorizationService.provisionNewUser(
      request.userId,
      request.email,
      request.organizationId,
    );
  }

  @Post('bootstrap')
  @ApiOperation({
    summary: 'Bootstrap admin access for the current user (development only)',
  })
  @HttpCode(HttpStatus.OK)
  @SkipEntitlementCheck()
  async bootstrapAdmin(@Req() req: Request) {
    // Get user from JWT (set by JwtAuthGuard)
    const user = (req as any).user;
    if (!user || !user.sub || !user.email) {
      return { error: 'No authenticated user found' };
    }

    const userId = user.sub;
    const email = user.email;
    const organizationId =
      user.organization || user.org_id || user.tenant_id || 'default';

    // Force re-provision with admin group
    return this.authorizationService.bootstrapAdminUser(
      userId,
      email,
      organizationId,
    );
  }
}
