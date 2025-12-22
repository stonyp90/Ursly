import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined), // No API key = disabled
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('initialization', () => {
    it('should initialize without Novu when API key is not set', () => {
      expect(service).toBeDefined();
    });
  });

  describe('createOrUpdateSubscriber', () => {
    it('should not throw when Novu is not configured', async () => {
      await expect(
        service.createOrUpdateSubscriber({
          subscriberId: 'user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('deleteSubscriber', () => {
    it('should not throw when Novu is not configured', async () => {
      await expect(service.deleteSubscriber('user-123')).resolves.not.toThrow();
    });
  });

  describe('sendNotification', () => {
    it('should not throw when Novu is not configured', async () => {
      await expect(
        service.sendNotification({
          subscriberId: 'user-123',
          workflowId: 'test-workflow',
          payload: { message: 'Test' },
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('notifyAgentStatusChange', () => {
    it('should handle notification without throwing', async () => {
      await expect(
        service.notifyAgentStatusChange(
          'user-123',
          'test@example.com',
          'Test Agent',
          'active',
          'idle',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('notifyAgentCreated', () => {
    it('should handle notification without throwing', async () => {
      await expect(
        service.notifyAgentCreated(
          'user-123',
          'test@example.com',
          'Test Agent',
          'agent-456',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('notifyTaskCompleted', () => {
    it('should handle notification without throwing', async () => {
      await expect(
        service.notifyTaskCompleted(
          'user-123',
          'task-456',
          'Test prompt',
          'agent-789',
          1500,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('notifySecurityAlert', () => {
    it('should handle security alert notification', async () => {
      await expect(
        service.notifySecurityAlert(
          'user-123',
          'test@example.com',
          'new_login',
          {
            ipAddress: '192.168.1.1',
            location: 'New York, US',
          },
        ),
      ).resolves.not.toThrow();
    });
  });
});
