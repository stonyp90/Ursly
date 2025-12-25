import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Permission,
  PermissionGroup,
  UserEntitlement,
  DefaultGroupAssignment,
  EntitlementAuditLog,
  SYSTEM_PERMISSIONS,
  SYSTEM_GROUPS,
} from '@ursly/access-control';
import {
  IPermissionRepository,
  IPermissionGroupRepository,
  IUserEntitlementRepository,
  IDefaultGroupAssignmentRepository,
  IEntitlementAuditLogRepository,
} from '../../ports/entitlement.port';
import {
  PermissionDocument,
  PermissionGroupDocument,
  UserEntitlementDocument,
  DefaultGroupAssignmentDocument,
  EntitlementAuditLogDocument,
} from '../schemas';

// =============================================================================
// Helper Functions
// =============================================================================

function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id;
}

function toObjectId(id: string): Types.ObjectId | string {
  // If it's a valid ObjectId, convert it; otherwise return as string for query flexibility
  if (isValidObjectId(id)) {
    return new Types.ObjectId(id);
  }
  // Return string as-is for non-ObjectId organization IDs (e.g., "org-1", "default")
  return id as any;
}

function fromDoc<T>(doc: any): T | null {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    id: obj._id?.toString(),
    _id: undefined,
    __v: undefined,
    organizationId: obj.organizationId?.toString(),
    groupIds: obj.groupIds?.map((id: any) => id.toString()),
    permissions: obj.permissions?.map((id: any) => id.toString()),
    directPermissions: obj.directPermissions?.map((id: any) => id.toString()),
    excludedPermissions: obj.excludedPermissions?.map((id: any) =>
      id.toString(),
    ),
    groupId: obj.groupId?.toString(),
    createdBy: obj.createdBy?.toString(),
    assignedBy: obj.assignedBy?.toString(),
  } as T;
}

// =============================================================================
// Permission Repository Adapter
// =============================================================================

@Injectable()
export class PermissionRepositoryAdapter implements IPermissionRepository {
  constructor(
    @InjectModel(PermissionDocument.name)
    private readonly model: Model<PermissionDocument>,
  ) {}

  async findById(id: string): Promise<Permission | null> {
    const doc = await this.model.findById(id);
    return fromDoc<Permission>(doc);
  }

  async findByCode(code: string): Promise<Permission | null> {
    const doc = await this.model.findOne({ code });
    return fromDoc<Permission>(doc);
  }

  async findByCategory(category: string): Promise<Permission[]> {
    const docs = await this.model.find({ category, isActive: true });
    return docs.map((doc) => fromDoc<Permission>(doc)!);
  }

  async findAll(): Promise<Permission[]> {
    const docs = await this.model.find({ isActive: true });
    return docs.map((doc) => fromDoc<Permission>(doc)!);
  }

  async findByIds(ids: string[]): Promise<Permission[]> {
    const objectIds = ids.map((id) => toObjectId(id));
    const docs = await this.model.find({ _id: { $in: objectIds } });
    return docs.map((doc) => fromDoc<Permission>(doc)!);
  }

  async create(
    permission: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Permission> {
    const doc = await this.model.create(permission);
    return fromDoc<Permission>(doc)!;
  }

  async update(
    id: string,
    updates: Partial<Permission>,
  ): Promise<Permission | null> {
    const doc = await this.model.findByIdAndUpdate(id, updates, { new: true });
    return fromDoc<Permission>(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: toObjectId(id) });
    return result.deletedCount > 0;
  }

  async seedSystemPermissions(): Promise<void> {
    for (const perm of SYSTEM_PERMISSIONS) {
      const exists = await this.model.findOne({ code: perm.code });
      if (!exists) {
        await this.model.create({
          ...perm,
          isSystem: true,
          isActive: true,
        });
      }
    }
  }
}

// =============================================================================
// Permission Group Repository Adapter
// =============================================================================

@Injectable()
export class PermissionGroupRepositoryAdapter implements IPermissionGroupRepository {
  constructor(
    @InjectModel(PermissionGroupDocument.name)
    private readonly model: Model<PermissionGroupDocument>,
    @InjectModel(PermissionDocument.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  async findById(id: string): Promise<PermissionGroup | null> {
    const doc = await this.model.findById(id);
    return fromDoc<PermissionGroup>(doc);
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<PermissionGroup | null> {
    const doc = await this.model.findOne({
      organizationId: toObjectId(organizationId),
      name,
    });
    return fromDoc<PermissionGroup>(doc);
  }

  async findByOrganization(organizationId: string): Promise<PermissionGroup[]> {
    const docs = await this.model.find({
      organizationId: toObjectId(organizationId),
    });
    return docs.map((doc) => fromDoc<PermissionGroup>(doc)!);
  }

  async findDefaultGroups(organizationId: string): Promise<PermissionGroup[]> {
    const docs = await this.model.find({
      organizationId: toObjectId(organizationId),
      isDefault: true,
    });
    return docs.map((doc) => fromDoc<PermissionGroup>(doc)!);
  }

  async findSystemGroups(): Promise<PermissionGroup[]> {
    const docs = await this.model.find({ type: 'system' });
    return docs.map((doc) => fromDoc<PermissionGroup>(doc)!);
  }

  async create(
    group: Omit<PermissionGroup, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PermissionGroup> {
    const doc = await this.model.create({
      ...group,
      organizationId: toObjectId(group.organizationId),
      permissions: group.permissions.map((id) => toObjectId(id)),
      createdBy: group.createdBy ? toObjectId(group.createdBy) : undefined,
    });
    return fromDoc<PermissionGroup>(doc)!;
  }

  async update(
    id: string,
    updates: Partial<PermissionGroup>,
  ): Promise<PermissionGroup | null> {
    const doc = await this.model.findByIdAndUpdate(id, updates, { new: true });
    return fromDoc<PermissionGroup>(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: toObjectId(id) });
    return result.deletedCount > 0;
  }

  async addPermissions(
    groupId: string,
    permissionIds: string[],
  ): Promise<PermissionGroup | null> {
    const doc = await this.model.findByIdAndUpdate(
      groupId,
      {
        $addToSet: {
          permissions: { $each: permissionIds.map((id) => toObjectId(id)) },
        },
      },
      { new: true },
    );
    return fromDoc<PermissionGroup>(doc);
  }

  async removePermissions(
    groupId: string,
    permissionIds: string[],
  ): Promise<PermissionGroup | null> {
    const doc = await this.model.findByIdAndUpdate(
      groupId,
      {
        $pull: {
          permissions: { $in: permissionIds.map((id) => toObjectId(id)) },
        },
      },
      { new: true },
    );
    return fromDoc<PermissionGroup>(doc);
  }

  async seedSystemGroups(organizationId: string): Promise<void> {
    for (const groupDef of SYSTEM_GROUPS) {
      const exists = await this.model.findOne({
        organizationId: toObjectId(organizationId),
        name: groupDef.name,
        type: 'system',
      });

      if (!exists) {
        // Get permission IDs by code
        const permissionDocs = await this.permissionModel.find({
          code: { $in: groupDef.permissions },
        });
        const permissionIds = permissionDocs.map((p) => p._id);

        await this.model.create({
          organizationId: toObjectId(organizationId),
          name: groupDef.name,
          description: groupDef.description,
          type: groupDef.type,
          permissions: permissionIds,
          isDefault: groupDef.isDefault,
          priority: 0,
          color: groupDef.color,
        });
      }
    }
  }
}

// =============================================================================
// User Entitlement Repository Adapter
// =============================================================================

@Injectable()
export class UserEntitlementRepositoryAdapter implements IUserEntitlementRepository {
  constructor(
    @InjectModel(UserEntitlementDocument.name)
    private readonly model: Model<UserEntitlementDocument>,
  ) {}

  async findById(id: string): Promise<UserEntitlement | null> {
    const doc = await this.model.findById(id);
    return fromDoc<UserEntitlement>(doc);
  }

  async findByUserId(
    userId: string,
    organizationId: string,
  ): Promise<UserEntitlement | null> {
    const doc = await this.model.findOne({
      userId,
      organizationId: toObjectId(organizationId),
    });
    return fromDoc<UserEntitlement>(doc);
  }

  async findByEmail(
    email: string,
    organizationId: string,
  ): Promise<UserEntitlement | null> {
    const doc = await this.model.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
      organizationId: toObjectId(organizationId),
    });
    return fromDoc<UserEntitlement>(doc);
  }

  async findByOrganization(organizationId: string): Promise<UserEntitlement[]> {
    const docs = await this.model.find({
      organizationId: toObjectId(organizationId),
    });
    return docs.map((doc) => fromDoc<UserEntitlement>(doc)!);
  }

  async findByGroup(groupId: string): Promise<UserEntitlement[]> {
    const docs = await this.model.find({ groupIds: toObjectId(groupId) });
    return docs.map((doc) => fromDoc<UserEntitlement>(doc)!);
  }

  async create(
    entitlement: Omit<UserEntitlement, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<UserEntitlement> {
    const doc = await this.model.create({
      ...entitlement,
      organizationId: toObjectId(entitlement.organizationId),
      groupIds: entitlement.groupIds.map((id) => toObjectId(id)),
      directPermissions: entitlement.directPermissions?.map((id) =>
        toObjectId(id),
      ),
      excludedPermissions: entitlement.excludedPermissions?.map((id) =>
        toObjectId(id),
      ),
      assignedBy: entitlement.assignedBy
        ? toObjectId(entitlement.assignedBy)
        : undefined,
    });
    return fromDoc<UserEntitlement>(doc)!;
  }

  async update(
    id: string,
    updates: Partial<UserEntitlement>,
  ): Promise<UserEntitlement | null> {
    const doc = await this.model.findByIdAndUpdate(id, updates, { new: true });
    return fromDoc<UserEntitlement>(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: toObjectId(id) });
    return result.deletedCount > 0;
  }

  async assignToGroups(
    id: string,
    groupIds: string[],
  ): Promise<UserEntitlement | null> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          groupIds: { $each: groupIds.map((gid) => toObjectId(gid)) },
        },
      },
      { new: true },
    );
    return fromDoc<UserEntitlement>(doc);
  }

  async removeFromGroups(
    id: string,
    groupIds: string[],
  ): Promise<UserEntitlement | null> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $pull: { groupIds: { $in: groupIds.map((gid) => toObjectId(gid)) } } },
      { new: true },
    );
    return fromDoc<UserEntitlement>(doc);
  }

  async setGroups(
    id: string,
    groupIds: string[],
  ): Promise<UserEntitlement | null> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $set: { groupIds: groupIds.map((gid) => toObjectId(gid)) } },
      { new: true },
    );
    return fromDoc<UserEntitlement>(doc);
  }

  async addDirectPermissions(
    id: string,
    permissionIds: string[],
  ): Promise<UserEntitlement | null> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          directPermissions: {
            $each: permissionIds.map((pid) => toObjectId(pid)),
          },
        },
      },
      { new: true },
    );
    return fromDoc<UserEntitlement>(doc);
  }

  async removeDirectPermissions(
    id: string,
    permissionIds: string[],
  ): Promise<UserEntitlement | null> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      {
        $pull: {
          directPermissions: {
            $in: permissionIds.map((pid) => toObjectId(pid)),
          },
        },
      },
      { new: true },
    );
    return fromDoc<UserEntitlement>(doc);
  }

  async addExcludedPermissions(
    id: string,
    permissionIds: string[],
  ): Promise<UserEntitlement | null> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          excludedPermissions: {
            $each: permissionIds.map((pid) => toObjectId(pid)),
          },
        },
      },
      { new: true },
    );
    return fromDoc<UserEntitlement>(doc);
  }

  async removeExcludedPermissions(
    id: string,
    permissionIds: string[],
  ): Promise<UserEntitlement | null> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      {
        $pull: {
          excludedPermissions: {
            $in: permissionIds.map((pid) => toObjectId(pid)),
          },
        },
      },
      { new: true },
    );
    return fromDoc<UserEntitlement>(doc);
  }
}

// =============================================================================
// Default Group Assignment Repository Adapter
// =============================================================================

@Injectable()
export class DefaultGroupAssignmentRepositoryAdapter implements IDefaultGroupAssignmentRepository {
  constructor(
    @InjectModel(DefaultGroupAssignmentDocument.name)
    private readonly model: Model<DefaultGroupAssignmentDocument>,
  ) {}

  async findById(id: string): Promise<DefaultGroupAssignment | null> {
    const doc = await this.model.findById(id);
    return fromDoc<DefaultGroupAssignment>(doc);
  }

  async findByOrganization(
    organizationId: string,
  ): Promise<DefaultGroupAssignment[]> {
    const docs = await this.model
      .find({ organizationId: toObjectId(organizationId) })
      .sort({ priority: -1 });
    return docs.map((doc) => fromDoc<DefaultGroupAssignment>(doc)!);
  }

  async findActiveByOrganization(
    organizationId: string,
  ): Promise<DefaultGroupAssignment[]> {
    const docs = await this.model
      .find({ organizationId: toObjectId(organizationId), isActive: true })
      .sort({ priority: -1 });
    return docs.map((doc) => fromDoc<DefaultGroupAssignment>(doc)!);
  }

  async create(
    assignment: Omit<DefaultGroupAssignment, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<DefaultGroupAssignment> {
    const doc = await this.model.create({
      ...assignment,
      organizationId: toObjectId(assignment.organizationId),
      groupId: toObjectId(assignment.groupId),
      createdBy: assignment.createdBy
        ? toObjectId(assignment.createdBy)
        : undefined,
    });
    return fromDoc<DefaultGroupAssignment>(doc)!;
  }

  async update(
    id: string,
    updates: Partial<DefaultGroupAssignment>,
  ): Promise<DefaultGroupAssignment | null> {
    const doc = await this.model.findByIdAndUpdate(id, updates, { new: true });
    return fromDoc<DefaultGroupAssignment>(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: toObjectId(id) });
    return result.deletedCount > 0;
  }
}

// =============================================================================
// Entitlement Audit Log Repository Adapter
// =============================================================================

@Injectable()
export class EntitlementAuditLogRepositoryAdapter implements IEntitlementAuditLogRepository {
  constructor(
    @InjectModel(EntitlementAuditLogDocument.name)
    private readonly model: Model<EntitlementAuditLogDocument>,
  ) {}

  async findById(id: string): Promise<EntitlementAuditLog | null> {
    const doc = await this.model.findById(id);
    return fromDoc<EntitlementAuditLog>(doc);
  }

  async findByOrganization(
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
  ): Promise<EntitlementAuditLog[]> {
    const query: any = { organizationId: toObjectId(organizationId) };

    if (options?.startDate) {
      query.createdAt = { $gte: options.startDate };
    }
    if (options?.endDate) {
      query.createdAt = { ...query.createdAt, $lte: options.endDate };
    }
    if (options?.action) {
      query.action = options.action;
    }
    if (options?.actorId) {
      query.actorId = options.actorId;
    }
    if (options?.targetType) {
      query.targetType = options.targetType;
    }

    const docs = await this.model
      .find(query)
      .sort({ createdAt: -1 })
      .skip(options?.offset || 0)
      .limit(options?.limit || 50);

    return docs.map((doc) => fromDoc<EntitlementAuditLog>(doc)!);
  }

  async create(
    log: Omit<EntitlementAuditLog, 'id' | 'createdAt'>,
  ): Promise<EntitlementAuditLog> {
    const doc = await this.model.create({
      ...log,
      organizationId: toObjectId(log.organizationId),
    });
    return fromDoc<EntitlementAuditLog>(doc)!;
  }

  async count(
    organizationId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      action?: string;
    },
  ): Promise<number> {
    const query: any = { organizationId: toObjectId(organizationId) };

    if (options?.startDate) {
      query.createdAt = { $gte: options.startDate };
    }
    if (options?.endDate) {
      query.createdAt = { ...query.createdAt, $lte: options.endDate };
    }
    if (options?.action) {
      query.action = options.action;
    }

    return this.model.countDocuments(query);
  }
}
