import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AgentsService } from './agents.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('AgentsService', () => {
  let service: AgentsService;
  let mockAgentModel: any;
  let mockAuditService: jest.Mocked<AuditService>;

  const mockAgent = {
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    name: 'Test Agent',
    model: 'llama2',
    systemPrompt: 'You are a helpful assistant',
    status: 'active',
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: jest.fn().mockReturnThis(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockAgentModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: mockAgent._id,
      save: jest.fn().mockResolvedValue({ ...mockAgent, toJSON: () => mockAgent }),
      toJSON: () => mockAgent,
    }));

    mockAgentModel.find = jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockAgent]),
    });

    mockAgentModel.findById = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockAgent),
    });

    mockAgentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockAgent),
    });

    mockAgentModel.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockAgent),
    });

    mockAgentModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
      findAll: jest.fn(),
      getMetrics: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        { provide: getModelToken('Agent'), useValue: mockAgentModel },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AgentsService>(AgentsService);
  });

  describe('create', () => {
    it('should create an agent successfully', async () => {
      const dto = { name: 'Test Agent', model: 'llama2', systemPrompt: 'Test prompt' };
      const result = await service.create(dto, 'user-123');

      expect(result).toBeDefined();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'agent_created' })
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated agents', async () => {
      const result = await service.findAll({ limit: 10, offset: 0 });

      expect(result.agents).toBeDefined();
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by status', async () => {
      await service.findAll({ status: 'active' });

      expect(mockAgentModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an agent by id', async () => {
      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAgent._id.toString());
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockAgentModel.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an agent', async () => {
      const dto = { name: 'Updated Agent' };
      const result = await service.update('507f1f77bcf86cd799439011', dto);

      expect(result).toBeDefined();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'agent_updated' })
      );
    });
  });

  describe('remove', () => {
    it('should delete an agent', async () => {
      await service.remove('507f1f77bcf86cd799439011');

      expect(mockAgentModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'agent_deleted' })
      );
    });
  });
});

