import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AgentRepositoryAdapter } from './agent.repository.adapter';

describe('AgentRepositoryAdapter', () => {
  let adapter: AgentRepositoryAdapter;
  let mockAgentModel: any;

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
  };

  beforeEach(async () => {
    mockAgentModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: mockAgent._id,
      save: jest
        .fn()
        .mockResolvedValue({ ...mockAgent, toJSON: () => mockAgent }),
    }));

    mockAgentModel.findById = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockAgent),
    });

    mockAgentModel.find = jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockAgent]),
    });

    mockAgentModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    mockAgentModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockAgent),
    });

    mockAgentModel.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockAgent),
    });

    mockAgentModel.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    mockAgentModel.exists = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: mockAgent._id }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentRepositoryAdapter,
        { provide: getModelToken('Agent'), useValue: mockAgentModel },
      ],
    }).compile();

    adapter = module.get<AgentRepositoryAdapter>(AgentRepositoryAdapter);
  });

  describe('create', () => {
    it('should create an agent', async () => {
      const dto = {
        name: 'Test Agent',
        model: 'llama2',
        systemPrompt: 'You are a helpful assistant',
      };

      const result = await adapter.create(dto, 'user-123');

      expect(result).toBeDefined();
      expect(result.name).toBe(mockAgent.name);
    });
  });

  describe('findById', () => {
    it('should find agent by id', async () => {
      const result = await adapter.findById('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockAgent._id);
    });

    it('should return null when agent not found', async () => {
      mockAgentModel.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await adapter.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all agents', async () => {
      const result = await adapter.findAll({ limit: 10, offset: 0 });

      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].name).toBe(mockAgent.name);
      expect(result.total).toBe(1);
    });
  });

  describe('update', () => {
    it('should update an agent', async () => {
      const dto = { name: 'Updated Agent' };

      const result = await adapter.update('507f1f77bcf86cd799439011', dto);

      expect(result).toBeDefined();
      expect(mockAgentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({ name: 'Updated Agent' }),
        { new: true },
      );
    });
  });

  describe('delete', () => {
    it('should delete an agent', async () => {
      const result = await adapter.delete('507f1f77bcf86cd799439011');

      expect(result).toBe(true);
      expect(mockAgentModel.deleteOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
      });
    });
  });

  describe('exists', () => {
    it('should return true when agent exists', async () => {
      mockAgentModel.countDocuments = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await adapter.exists('507f1f77bcf86cd799439011');

      expect(result).toBe(true);
    });

    it('should return false when agent does not exist', async () => {
      mockAgentModel.countDocuments = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      const result = await adapter.exists('nonexistent');

      expect(result).toBe(false);
    });
  });
});
