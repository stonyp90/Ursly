import { CreateAgentUseCase } from './create-agent.use-case';
import { IAgentRepository } from '../../ports/agent.repository.port';
import { IAuditLogRepository } from '../../ports/audit-log.repository.port';
import { IOllamaService } from '../../ports/ollama.service.port';
import { Agent } from '@ursly/shared/types';

describe('CreateAgentUseCase', () => {
  let useCase: CreateAgentUseCase;
  let mockAgentRepository: jest.Mocked<IAgentRepository>;
  let mockAuditLogRepository: jest.Mocked<IAuditLogRepository>;
  let mockOllamaService: jest.Mocked<IOllamaService>;

  const mockAgent: Agent = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Agent',
    model: 'llama2',
    systemPrompt: 'You are a helpful assistant',
    status: 'active',
    capabilities: [],
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockAgentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockAuditLogRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      query: jest.fn(),
      findByAgentId: jest.fn(),
      findByTaskId: jest.fn(),
      findByUserId: jest.fn(),
    };

    mockOllamaService = {
      listModels: jest.fn(),
      hasModel: jest.fn(),
      generate: jest.fn(),
      generateStream: jest.fn(),
      isHealthy: jest.fn(),
    };

    useCase = new CreateAgentUseCase(
      mockAgentRepository,
      mockAuditLogRepository,
      mockOllamaService,
    );
  });

  it('should create an agent successfully', async () => {
    mockOllamaService.hasModel.mockResolvedValue(true);
    mockAgentRepository.create.mockResolvedValue(mockAgent);
    mockAuditLogRepository.create.mockResolvedValue({} as any);

    const result = await useCase.execute({
      dto: {
        name: 'Test Agent',
        model: 'llama2',
        systemPrompt: 'You are a helpful assistant',
      },
      userId: 'user-123',
    });

    expect(result.agent).toEqual(mockAgent);
    expect(mockOllamaService.hasModel).toHaveBeenCalledWith('llama2');
    expect(mockAgentRepository.create).toHaveBeenCalled();
    expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'agent_created',
        agentId: mockAgent.id,
        userId: 'user-123',
      }),
    );
  });

  it('should throw error when model does not exist', async () => {
    mockOllamaService.hasModel.mockResolvedValue(false);

    await expect(
      useCase.execute({
        dto: {
          name: 'Test Agent',
          model: 'nonexistent-model',
          systemPrompt: 'You are a helpful assistant',
        },
        userId: 'user-123',
      }),
    ).rejects.toThrow("Model 'nonexistent-model' is not available in Ollama");

    expect(mockAgentRepository.create).not.toHaveBeenCalled();
  });

  it('should validate input with Zod schema', async () => {
    mockOllamaService.hasModel.mockResolvedValue(true);

    await expect(
      useCase.execute({
        dto: {
          name: '', // Empty name should fail validation
          model: 'llama2',
          systemPrompt: 'You are a helpful assistant',
        },
        userId: 'user-123',
      }),
    ).rejects.toThrow();
  });
});
