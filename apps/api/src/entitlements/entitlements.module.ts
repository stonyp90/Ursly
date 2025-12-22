import { Module, Global, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers
import {
  PermissionsController,
  GroupsController,
  UserEntitlementsController,
  DefaultGroupsController,
  AuthorizationController,
} from './controllers/entitlements.controller';

// Services
import { AuthorizationService } from './services/authorization.service';

// Port tokens
import {
  IPermissionRepository,
  IPermissionGroupRepository,
  PERMISSION_REPOSITORY,
  PERMISSION_GROUP_REPOSITORY,
  USER_ENTITLEMENT_REPOSITORY,
  DEFAULT_GROUP_ASSIGNMENT_REPOSITORY,
  ENTITLEMENT_AUDIT_LOG_REPOSITORY,
  AUTHORIZATION_SERVICE,
} from './ports/entitlement.port';

// Mongoose Schemas
import {
  PermissionDocument,
  PermissionMongooseSchema,
  PermissionGroupDocument,
  PermissionGroupMongooseSchema,
  UserEntitlementDocument,
  UserEntitlementMongooseSchema,
  DefaultGroupAssignmentDocument,
  DefaultGroupAssignmentMongooseSchema,
  EntitlementAuditLogDocument,
  EntitlementAuditLogMongooseSchema,
} from './adapters/schemas';

// Repository Adapters
import {
  PermissionRepositoryAdapter,
  PermissionGroupRepositoryAdapter,
  UserEntitlementRepositoryAdapter,
  DefaultGroupAssignmentRepositoryAdapter,
  EntitlementAuditLogRepositoryAdapter,
} from './adapters/repositories';

// Guard
import { EntitlementGuard } from './guards/entitlement.guard';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PermissionDocument.name, schema: PermissionMongooseSchema },
      { name: PermissionGroupDocument.name, schema: PermissionGroupMongooseSchema },
      { name: UserEntitlementDocument.name, schema: UserEntitlementMongooseSchema },
      { name: DefaultGroupAssignmentDocument.name, schema: DefaultGroupAssignmentMongooseSchema },
      { name: EntitlementAuditLogDocument.name, schema: EntitlementAuditLogMongooseSchema },
    ]),
  ],
  controllers: [
    PermissionsController,
    GroupsController,
    UserEntitlementsController,
    DefaultGroupsController,
    AuthorizationController,
  ],
  providers: [
    // Repository Adapters
    {
      provide: PERMISSION_REPOSITORY,
      useClass: PermissionRepositoryAdapter,
    },
    {
      provide: PERMISSION_GROUP_REPOSITORY,
      useClass: PermissionGroupRepositoryAdapter,
    },
    {
      provide: USER_ENTITLEMENT_REPOSITORY,
      useClass: UserEntitlementRepositoryAdapter,
    },
    {
      provide: DEFAULT_GROUP_ASSIGNMENT_REPOSITORY,
      useClass: DefaultGroupAssignmentRepositoryAdapter,
    },
    {
      provide: ENTITLEMENT_AUDIT_LOG_REPOSITORY,
      useClass: EntitlementAuditLogRepositoryAdapter,
    },
    // Authorization Service
    {
      provide: AUTHORIZATION_SERVICE,
      useClass: AuthorizationService,
    },
    // Guard - register as global guard to check permissions
    EntitlementGuard,
    {
      provide: APP_GUARD,
      useClass: EntitlementGuard,
    },
  ],
  exports: [
    PERMISSION_REPOSITORY,
    PERMISSION_GROUP_REPOSITORY,
    USER_ENTITLEMENT_REPOSITORY,
    DEFAULT_GROUP_ASSIGNMENT_REPOSITORY,
    ENTITLEMENT_AUDIT_LOG_REPOSITORY,
    AUTHORIZATION_SERVICE,
    EntitlementGuard,
  ],
})
export class EntitlementsModule implements OnModuleInit {
  private readonly logger = new Logger(EntitlementsModule.name);

  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    @Inject(PERMISSION_GROUP_REPOSITORY)
    private readonly groupRepository: IPermissionGroupRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      // Seed system permissions on startup
      this.logger.log('Seeding system permissions...');
      await this.permissionRepository.seedSystemPermissions();
      this.logger.log('System permissions seeded successfully');

      // Seed system groups for default organization
      // Note: In production, you'd seed for each organization or on first access
      this.logger.log('Seeding system groups for default organization...');
      await this.groupRepository.seedSystemGroups('default');
      this.logger.log('System groups seeded successfully');
    } catch (error) {
      this.logger.error('Failed to seed entitlements:', error.message);
    }
  }
}

