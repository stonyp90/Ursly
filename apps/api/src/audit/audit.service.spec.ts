import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { AuditEventTypeEnum } from '@ursly/shared/types';

describe('AuditService', () => {
  let service: AuditService;
  let mockAuditLogModel: any;

  const mockAuditLog = {
    _id: '507f1f77bcf86cd799439011',
    eventType: AuditEventTypeEnum.AGENT_CREATED,
    agentId: 'agent-123',
    userId: 'user-123',
    timestamp: new Date(),
    metadata: { name: 'Test Agent' },
    toJSON: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    mockAuditLogModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: mockAuditLog._id,
      save: jest
        .fn()
        .mockResolvedValue({ ...mockAuditLog, toJSON: () => mockAuditLog }),
      toJSON: () => mockAuditLog,
    }));

    mockAuditLogModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockAuditLog]),
    });

    mockAuditLogModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    mockAuditLogModel.aggregate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([{ _id: 'agent_created', count: 5 }]),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getModelToken('AuditLog'), useValue: mockAuditLogModel },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      const dto = {
        eventType: 'agent_created' as const,
        agentId: 'agent-123',
        userId: 'user-123',
        metadata: { name: 'Test Agent' },
      };

      const result = await service.log(dto);

      expect(result).toBeDefined();
      expect(result.eventType).toBe(AuditEventTypeEnum.AGENT_CREATED);
    });
  });

  describe('query', () => {
    it('should query audit logs with filters', async () => {
      const result = await service.query({
        eventType: AuditEventTypeEnum.AGENT_CREATED,
        limit: 10,
        offset: 0,
      });

      expect(result.logs).toBeDefined();
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by date range', async () => {
      await service.query({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      expect(mockAuditLogModel.find).toHaveBeenCalled();
    });

    it('should filter by agentId', async () => {
      await service.query({ agentId: 'agent-123' });

      expect(mockAuditLogModel.find).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return audit statistics', async () => {
      const result = await service.getStats();

      expect(result.totalEvents).toBeDefined();
      expect(result.eventsByType).toBeDefined();
    });

    it('should filter stats by agentId', async () => {
      await service.getStats('agent-123');

      expect(mockAuditLogModel.countDocuments).toHaveBeenCalled();
      expect(mockAuditLogModel.aggregate).toHaveBeenCalled();
    });
  });
});
