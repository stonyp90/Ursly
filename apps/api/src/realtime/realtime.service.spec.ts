import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeService } from './realtime.service';
import { RealtimeGateway } from './realtime.gateway';

describe('RealtimeService', () => {
  let service: RealtimeService;
  let mockGateway: jest.Mocked<RealtimeGateway>;

  beforeEach(async () => {
    mockGateway = {
      server: {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      },
      emitToEntity: jest.fn(),
      emitToOrganization: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeService,
        { provide: RealtimeGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<RealtimeService>(RealtimeService);
  });

  describe('emit via public methods', () => {
    it('should emit to specific entity room via emitAgentUpdated', () => {
      service.emitAgentUpdated('agent-123', 'Test', 'org-456');

      expect(mockGateway.emitToEntity).toHaveBeenCalledWith(
        'agent',
        'agent-123',
        expect.objectContaining({
          entityType: 'agent',
          entityId: 'agent-123',
          eventType: 'updated',
        }),
      );
    });

    it('should emit to all entities room via emitAgentCreated', () => {
      service.emitAgentCreated('agent-123', 'Test Agent', 'org-456');

      expect(mockGateway.emitToEntity).toHaveBeenCalled();
    });

    it('should emit to organization room via emitModelReady', () => {
      service.emitModelReady('llama2', 4000000000, 'org-789');

      expect(mockGateway.emitToOrganization).toHaveBeenCalledWith(
        'org-789',
        expect.objectContaining({
          entityType: 'model',
        }),
      );
    });
  });

  describe('emitAgentCreated', () => {
    it('should emit agent created event', () => {
      service.emitAgentCreated('agent-123', 'Test Agent', 'org-456');

      expect(mockGateway.emitToEntity).toHaveBeenCalledWith(
        'agent',
        'agent-123',
        expect.objectContaining({
          entityType: 'agent',
          eventType: 'created',
        }),
      );
    });
  });

  describe('emitAgentUpdated', () => {
    it('should emit agent updated event', () => {
      service.emitAgentUpdated('agent-123', 'Updated Agent', 'org-456');

      expect(mockGateway.emitToEntity).toHaveBeenCalledWith(
        'agent',
        'agent-123',
        expect.objectContaining({
          entityType: 'agent',
          eventType: 'updated',
        }),
      );
    });
  });

  describe('emitAgentDeleted', () => {
    it('should emit agent deleted event', () => {
      service.emitAgentDeleted('agent-123', 'org-456');

      expect(mockGateway.emitToEntity).toHaveBeenCalledWith(
        'agent',
        'agent-123',
        expect.objectContaining({
          entityType: 'agent',
          eventType: 'deleted',
        }),
      );
    });
  });

  describe('emitAgentStatusChanged', () => {
    it('should emit status changed event', () => {
      service.emitAgentStatusChanged('agent-123', 'active', 'idle', 'org-456');

      expect(mockGateway.emitToEntity).toHaveBeenCalledWith(
        'agent',
        'agent-123',
        expect.objectContaining({
          entityType: 'agent',
          eventType: 'status_changed',
          data: expect.objectContaining({
            status: 'active',
            previousStatus: 'idle',
          }),
        }),
      );
    });
  });

  describe('emitModelPulling', () => {
    it('should emit model pulling progress', () => {
      service.emitModelPulling('llama2', 45, 'org-456');

      expect(mockGateway.emitToEntity).toHaveBeenCalledWith(
        'model',
        'llama2',
        expect.objectContaining({
          entityType: 'model',
          data: expect.objectContaining({
            progress: 45,
            status: 'pulling',
          }),
        }),
      );
    });
  });

  describe('emitTaskStream', () => {
    it('should emit task stream chunk', () => {
      service.emitTaskStream('task-123', 'Hello world', 'org-456');

      expect(mockGateway.emitToEntity).toHaveBeenCalledWith(
        'task',
        'task-123',
        expect.objectContaining({
          entityType: 'task',
          data: expect.objectContaining({
            streamChunk: 'Hello world',
          }),
        }),
      );
    });
  });
});
