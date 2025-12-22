import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// =============================================================================
// Permission Schema
// =============================================================================

@Schema({ timestamps: true, collection: 'permissions' })
export class PermissionDocument extends Document {
  @Prop({ type: String, required: true, unique: true })
  code: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: String, required: true })
  category: string;

  @Prop({ type: String, required: true })
  action: string;

  @Prop({ type: Boolean, default: false })
  isSystem: boolean;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const PermissionMongooseSchema =
  SchemaFactory.createForClass(PermissionDocument);

// =============================================================================
// Permission Group Schema
// =============================================================================

@Schema({ timestamps: true, collection: 'permission_groups' })
export class PermissionGroupDocument extends Document {
  @Prop({ type: String, required: true })
  organizationId: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: String, required: true, enum: ['system', 'custom', 'default'] })
  type: string;

  @Prop({ type: [Types.ObjectId], ref: 'PermissionDocument', default: [] })
  permissions: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;

  @Prop({ type: Number, default: 0 })
  priority: number;

  @Prop({ type: String })
  color?: string;

  @Prop({ type: String })
  icon?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({ type: String })
  createdBy?: string;
}

export const PermissionGroupMongooseSchema = SchemaFactory.createForClass(
  PermissionGroupDocument,
);
PermissionGroupMongooseSchema.index(
  { organizationId: 1, name: 1 },
  { unique: true },
);

// =============================================================================
// User Entitlement Schema
// =============================================================================

@Schema({ timestamps: true, collection: 'user_entitlements' })
export class UserEntitlementDocument extends Document {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  organizationId: string;

  @Prop({ type: [Types.ObjectId], ref: 'PermissionGroupDocument', default: [] })
  groupIds: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'PermissionDocument', default: [] })
  directPermissions?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'PermissionDocument', default: [] })
  excludedPermissions?: Types.ObjectId[];

  @Prop({
    type: String,
    default: 'active',
    enum: ['active', 'suspended', 'pending', 'expired'],
  })
  status: string;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Date })
  lastValidatedAt?: Date;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({ type: String })
  assignedBy?: string;
}

export const UserEntitlementMongooseSchema = SchemaFactory.createForClass(
  UserEntitlementDocument,
);
UserEntitlementMongooseSchema.index(
  { userId: 1, organizationId: 1 },
  { unique: true },
);
UserEntitlementMongooseSchema.index({ email: 1, organizationId: 1 });

// =============================================================================
// Default Group Assignment Schema
// =============================================================================

@Schema({ timestamps: true, collection: 'default_group_assignments' })
export class DefaultGroupAssignmentDocument extends Document {
  @Prop({ type: String, required: true })
  organizationId: string;

  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: 'PermissionGroupDocument',
  })
  groupId: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: ['always', 'email_domain', 'email_pattern', 'invitation'],
  })
  conditionType: string;

  @Prop({ type: String })
  conditionValue?: string;

  @Prop({ type: Number, default: 0 })
  priority: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String })
  createdBy?: string;
}

export const DefaultGroupAssignmentMongooseSchema =
  SchemaFactory.createForClass(DefaultGroupAssignmentDocument);
DefaultGroupAssignmentMongooseSchema.index({ organizationId: 1, priority: -1 });

// =============================================================================
// Entitlement Audit Log Schema
// =============================================================================

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'entitlement_audit_logs',
})
export class EntitlementAuditLogDocument extends Document {
  @Prop({ type: String, required: true })
  organizationId: string;

  @Prop({ type: String, required: true })
  action: string;

  @Prop({ type: String, required: true })
  actorId: string;

  @Prop({ type: String, required: true })
  actorEmail: string;

  @Prop({
    type: String,
    required: true,
    enum: ['permission', 'group', 'user_entitlement', 'authorization'],
  })
  targetType: string;

  @Prop({ type: String, required: true })
  targetId: string;

  @Prop({ type: Object })
  changes?: Record<string, unknown>;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop({ type: String })
  ipAddress?: string;

  @Prop({ type: String })
  userAgent?: string;
}

export const EntitlementAuditLogMongooseSchema = SchemaFactory.createForClass(
  EntitlementAuditLogDocument,
);
EntitlementAuditLogMongooseSchema.index({ organizationId: 1, createdAt: -1 });
EntitlementAuditLogMongooseSchema.index({ actorId: 1, createdAt: -1 });
