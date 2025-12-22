import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from './authorization.service';
import {
  PERMISSION_REPOSITORY,
  PERMISSION_GROUP_REPOSITORY,
  USER_ENTITLEMENT_REPOSITORY,
  DEFAULT_GROUP_ASSIGNMENT_REPOSITORY,
  ENTITLEMENT_AUDIT_LOG_REPOSITORY,
} from '../ports/entitlement.port';

describe('AuthorizationService', () => {
  let service: AuthorizationService;

  const mockPermissionRepo = {
    findAll: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findByIds: jest.fn().mockResolvedValue([]),
    findByCode: jest.fn(),
    seedSystemPermissions: jest.fn().mockResolvedValue(undefined),
  };

  const mockGroupRepo = {
    findById: jest.fn(),
    findAll: jest.fn().mockResolvedValue([]),
    findDefaultGroups: jest.fn().mockResolvedValue([]),
    findByOrganization: jest.fn().mockResolvedValue([]),
    seedSystemGroups: jest.fn().mockResolvedValue(undefined),
  };

  const mockEntitlementRepo = {
    findByUserId: jest.fn(),
    findByGroup: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockDefaultGroupRepo = {
    findActiveByOrganization: jest.fn().mockResolvedValue([]),
  };

  const mockAuditLogRepo = {
    create: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        { provide: PERMISSION_REPOSITORY, useValue: mockPermissionRepo },
        { provide: PERMISSION_GROUP_REPOSITORY, useValue: mockGroupRepo },
        { provide: USER_ENTITLEMENT_REPOSITORY, useValue: mockEntitlementRepo },
        {
          provide: DEFAULT_GROUP_ASSIGNMENT_REPOSITORY,
          useValue: mockDefaultGroupRepo,
        },
        {
          provide: ENTITLEMENT_AUDIT_LOG_REPOSITORY,
          useValue: mockAuditLogRepo,
        },
      ],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
    jest.clearAllMocks();
  });

  describe('authorize', () => {
    it('should deny access when user has no entitlements and provisioning fails', async () => {
      mockEntitlementRepo.findByUserId.mockResolvedValue(null);
      mockDefaultGroupRepo.findActiveByOrganization.mockResolvedValue([]);
      mockGroupRepo.findDefaultGroups.mockResolvedValue([]);
      mockEntitlementRepo.create.mockResolvedValue(null);

      const result = await service.authorize({
        userId: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
        resource: 'agents',
        action: 'read',
      });

      expect(result.allowed).toBe(false);
    });

    it('should deny access when entitlement is suspended', async () => {
      mockEntitlementRepo.findByUserId.mockResolvedValue({
        id: 'ent-1',
        userId: 'user-123',
        email: 'test@example.com',
        status: 'suspended',
        groupIds: [],
      });

      const result = await service.authorize({
        userId: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
        resource: 'agents',
        action: 'read',
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('suspended');
    });

    it('should deny access when email does not match', async () => {
      mockEntitlementRepo.findByUserId.mockResolvedValue({
        id: 'ent-1',
        userId: 'user-123',
        email: 'different@example.com',
        status: 'active',
        groupIds: [],
      });

      const result = await service.authorize({
        userId: 'user-123',
        email: 'test@example.com',
        organizationId: 'org-456',
        resource: 'agents',
        action: 'read',
      });

      expect(result.allowed).toBe(false);
    });
  });

  describe('validateEntitlements', () => {
    it('should return true when no entitlement exists (new user)', async () => {
      mockEntitlementRepo.findByUserId.mockResolvedValue(null);

      const result = await service.validateEntitlements(
        'user-123',
        'test@example.com',
        'org-456',
      );

      expect(result).toBe(true);
    });

    it('should return true for active entitlement with matching email', async () => {
      mockEntitlementRepo.findByUserId.mockResolvedValue({
        id: 'ent-1',
        userId: 'user-123',
        email: 'test@example.com',
        status: 'active',
      });
      mockEntitlementRepo.update.mockResolvedValue({});

      const result = await service.validateEntitlements(
        'user-123',
        'test@example.com',
        'org-456',
      );

      expect(result).toBe(true);
    });

    it('should return false for suspended entitlement', async () => {
      mockEntitlementRepo.findByUserId.mockResolvedValue({
        id: 'ent-1',
        userId: 'user-123',
        email: 'test@example.com',
        status: 'suspended',
      });

      const result = await service.validateEntitlements(
        'user-123',
        'test@example.com',
        'org-456',
      );

      expect(result).toBe(false);
    });

    it('should return false for expired entitlement', async () => {
      mockEntitlementRepo.findByUserId.mockResolvedValue({
        id: 'ent-1',
        userId: 'user-123',
        email: 'test@example.com',
        status: 'active',
        expiresAt: new Date('2020-01-01'),
      });
      mockEntitlementRepo.update.mockResolvedValue({});

      const result = await service.validateEntitlements(
        'user-123',
        'test@example.com',
        'org-456',
      );

      expect(result).toBe(false);
    });
  });

  describe('provisionNewUser', () => {
    it('should provision user with default groups', async () => {
      mockDefaultGroupRepo.findActiveByOrganization.mockResolvedValue([
        { groupId: 'group-1', conditionType: 'always', priority: 1 },
      ]);
      mockEntitlementRepo.create.mockResolvedValue({
        id: 'ent-1',
        userId: 'user-123',
        email: 'test@example.com',
        groupIds: ['group-1'],
        status: 'active',
      });

      const result = await service.provisionNewUser(
        'user-123',
        'test@example.com',
        'org-456',
      );

      expect(result).toBeDefined();
      expect(mockEntitlementRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          email: 'test@example.com',
          groupIds: ['group-1'],
        }),
      );
    });

    it('should match email domain condition', async () => {
      mockDefaultGroupRepo.findActiveByOrganization.mockResolvedValue([
        {
          groupId: 'group-1',
          conditionType: 'email_domain',
          conditionValue: 'company.com',
          priority: 1,
        },
      ]);
      mockEntitlementRepo.create.mockResolvedValue({
        id: 'ent-1',
        userId: 'user-123',
        email: 'user@company.com',
        groupIds: ['group-1'],
        status: 'active',
      });

      const result = await service.provisionNewUser(
        'user-123',
        'user@company.com',
        'org-456',
      );

      expect(result).toBeDefined();
      expect(mockEntitlementRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ groupIds: ['group-1'] }),
      );
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate cache for a user', () => {
      // Just ensure it doesn't throw
      expect(() =>
        service.invalidateCache('user-123', 'org-456'),
      ).not.toThrow();
    });
  });
});
