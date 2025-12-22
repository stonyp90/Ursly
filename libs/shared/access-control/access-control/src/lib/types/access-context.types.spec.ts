import {
  AccessContextSchema,
  SecurityLevel,
  SubjectSchema,
  ResourceSchema,
  ActionSchema,
  EnvironmentSchema,
  type AccessContext,
  type AccessDecision,
  type AuthorizationResult,
} from './access-context.types';

describe('Access Context Types', () => {
  describe('SecurityLevel enum', () => {
    it('should have correct security levels', () => {
      expect(SecurityLevel.PUBLIC).toBe(0);
      expect(SecurityLevel.INTERNAL).toBe(1);
      expect(SecurityLevel.CONFIDENTIAL).toBe(2);
      expect(SecurityLevel.SECRET).toBe(3);
      expect(SecurityLevel.TOP_SECRET).toBe(4);
    });
  });

  describe('SubjectSchema', () => {
    it('should validate a valid subject', () => {
      const subject = {
        id: 'user-123',
        type: 'user' as const,
        roles: ['agent-admin', 'viewer'],
        attributes: { department: 'engineering' },
        organizationId: 'org-456',
      };

      const result = SubjectSchema.safeParse(subject);
      expect(result.success).toBe(true);
    });

    it('should reject invalid subject type', () => {
      const subject = {
        id: 'user-123',
        type: 'invalid',
        roles: [],
        attributes: {},
        organizationId: 'org-456',
      };

      const result = SubjectSchema.safeParse(subject);
      expect(result.success).toBe(false);
    });

    it('should accept optional clearance level', () => {
      const subject = {
        id: 'user-123',
        type: 'user' as const,
        roles: ['agent-admin'],
        attributes: {},
        organizationId: 'org-456',
        clearanceLevel: SecurityLevel.CONFIDENTIAL,
      };

      const result = SubjectSchema.safeParse(subject);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clearanceLevel).toBe(SecurityLevel.CONFIDENTIAL);
      }
    });
  });

  describe('ResourceSchema', () => {
    it('should validate a valid resource', () => {
      const resource = {
        id: 'agent-789',
        type: 'agent' as const,
        ownerId: 'user-123',
        organizationId: 'org-456',
        attributes: { department: 'engineering' },
      };

      const result = ResourceSchema.safeParse(resource);
      expect(result.success).toBe(true);
    });

    it('should accept all valid resource types', () => {
      const types = [
        'agent',
        'model',
        'task',
        'conversation',
        'document',
        'organization',
        'audit-log',
      ];

      types.forEach((type) => {
        const resource = {
          id: 'resource-123',
          type,
          ownerId: 'user-123',
          organizationId: 'org-456',
          attributes: {},
        };

        const result = ResourceSchema.safeParse(resource);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('ActionSchema', () => {
    it('should validate all action types', () => {
      const actionTypes = [
        'create',
        'read',
        'update',
        'delete',
        'execute',
        'share',
        'admin',
      ];

      actionTypes.forEach((type) => {
        const action = { type };
        const result = ActionSchema.safeParse(action);
        expect(result.success).toBe(true);
      });
    });

    it('should accept optional scope', () => {
      const action = {
        type: 'read' as const,
        scope: 'own',
      };

      const result = ActionSchema.safeParse(action);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scope).toBe('own');
      }
    });
  });

  describe('EnvironmentSchema', () => {
    it('should validate environment context', () => {
      const environment = {
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = EnvironmentSchema.safeParse(environment);
      expect(result.success).toBe(true);
    });

    it('should accept geo location', () => {
      const environment = {
        timestamp: new Date(),
        geoLocation: {
          country: 'US',
          city: 'San Francisco',
          latitude: 37.7749,
          longitude: -122.4194,
        },
      };

      const result = EnvironmentSchema.safeParse(environment);
      expect(result.success).toBe(true);
    });
  });

  describe('AccessContextSchema', () => {
    it('should validate complete access context', () => {
      const context: AccessContext = {
        subject: {
          id: 'user-123',
          type: 'user',
          roles: ['agent-admin'],
          attributes: { department: 'engineering' },
          organizationId: 'org-456',
        },
        resource: {
          id: 'agent-789',
          type: 'agent',
          ownerId: 'user-123',
          organizationId: 'org-456',
          attributes: {},
        },
        action: {
          type: 'execute',
        },
        environment: {
          timestamp: new Date(),
          ipAddress: '192.168.1.1',
        },
      };

      const result = AccessContextSchema.safeParse(context);
      expect(result.success).toBe(true);
    });
  });

  describe('Type interfaces', () => {
    it('should allow creating AccessDecision objects', () => {
      const decision: AccessDecision = {
        allowed: true,
        reason: 'RBAC: agent-admin role grants access',
      };

      expect(decision.allowed).toBe(true);
      expect(decision.reason).toBeDefined();
    });

    it('should allow creating AuthorizationResult objects', () => {
      const result: AuthorizationResult = {
        allowed: true,
        decisions: [
          { engine: 'rbac', allowed: true, reason: 'Role grants access' },
          { engine: 'abac', allowed: true, reason: 'Attributes match' },
        ],
        duration: 5,
      };

      expect(result.allowed).toBe(true);
      expect(result.decisions).toHaveLength(2);
      expect(result.duration).toBe(5);
    });
  });
});

