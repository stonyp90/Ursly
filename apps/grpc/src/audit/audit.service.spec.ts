import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';

describe('AuditService (gRPC)', () => {
  let service: AuditService;
  let consoleSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService],
    }).compile();

    service = module.get<AuditService>(AuditService);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('logEvent', () => {
    it('should log event to console', async () => {
      await service.logEvent({
        eventType: 'PROMPT_SENT',
        agentId: 'agent-123',
        taskId: 'task-456',
        metadata: { model: 'llama2' },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.objectContaining({
          eventType: 'PROMPT_SENT',
          agentId: 'agent-123',
          taskId: 'task-456',
          timestamp: expect.any(String),
        })
      );
    });

    it('should log event with token usage', async () => {
      await service.logEvent({
        eventType: 'RESPONSE_RECEIVED',
        agentId: 'agent-123',
        duration: 1500,
        tokenUsage: {
          promptTokens: 100,
          completionTokens: 200,
          totalTokens: 300,
        },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.objectContaining({
          eventType: 'RESPONSE_RECEIVED',
          duration: 1500,
          tokenUsage: {
            promptTokens: 100,
            completionTokens: 200,
            totalTokens: 300,
          },
        })
      );
    });

    it('should handle events without optional fields', async () => {
      await service.logEvent({
        eventType: 'MODEL_PULLED',
        metadata: { modelName: 'llama2' },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AUDIT]',
        expect.objectContaining({
          eventType: 'MODEL_PULLED',
          metadata: { modelName: 'llama2' },
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      consoleSpy.mockImplementation(() => {
        throw new Error('Log failed');
      });

      await expect(service.logEvent({ eventType: 'TEST' })).resolves.not.toThrow();

      errorSpy.mockRestore();
    });
  });
});

