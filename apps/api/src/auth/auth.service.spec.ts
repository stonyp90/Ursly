import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { KeycloakService } from './keycloak.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockAgentTokenModel: any;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockKeycloakService: jest.Mocked<KeycloakService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  const mockToken = {
    _id: '507f1f77bcf86cd799439011',
    agentId: 'agent-123',
    token: 'mock-jwt-token',
    userId: 'user-123',
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 300000),
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockAgentTokenModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue(mockToken),
    }));

    mockAgentTokenModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockToken),
    });

    mockAgentTokenModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    mockAgentTokenModel.deleteMany = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 5 }),
    });

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn().mockReturnValue({
        agentId: 'agent-123',
        userId: 'user-123',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 300,
      }),
    } as any;

    mockKeycloakService = {
      validateToken: jest.fn().mockResolvedValue({
        sub: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
      }),
    } as any;

    mockConfigService = {
      get: jest.fn().mockReturnValue(300),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken('AgentToken'), useValue: mockAgentTokenModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: KeycloakService, useValue: mockKeycloakService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('exchangeToken', () => {
    it('should exchange Keycloak token for agent token', async () => {
      const dto = {
        keycloakToken: 'valid-keycloak-token',
        agentId: 'agent-123',
      };

      const result = await service.exchangeToken(dto);

      expect(result.agentToken).toBeDefined();
      expect(result.agentId).toBe('agent-123');
      expect(result.expiresIn).toBe(300);
      expect(mockKeycloakService.validateToken).toHaveBeenCalledWith('valid-keycloak-token');
    });

    it('should throw UnauthorizedException for invalid Keycloak token', async () => {
      mockKeycloakService.validateToken.mockResolvedValue(null);

      await expect(
        service.exchangeToken({
          keycloakToken: 'invalid-token',
          agentId: 'agent-123',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateAgentToken', () => {
    it('should validate a valid agent token', async () => {
      const result = await service.validateAgentToken('mock-jwt-token');

      expect(result).toBeDefined();
      expect(result.agentId).toBe('agent-123');
      expect(result.userId).toBe('user-123');
    });

    it('should throw UnauthorizedException for expired token', async () => {
      mockAgentTokenModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.validateAgentToken('expired-token')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('revokeToken', () => {
    it('should revoke a token', async () => {
      await service.revokeToken('mock-jwt-token');

      expect(mockAgentTokenModel.deleteOne).toHaveBeenCalledWith({ token: 'mock-jwt-token' });
    });
  });

  describe('revokeAllAgentTokens', () => {
    it('should revoke all tokens for an agent', async () => {
      const result = await service.revokeAllAgentTokens('agent-123');

      expect(result).toBe(5);
      expect(mockAgentTokenModel.deleteMany).toHaveBeenCalledWith({ agentId: 'agent-123' });
    });
  });
});

