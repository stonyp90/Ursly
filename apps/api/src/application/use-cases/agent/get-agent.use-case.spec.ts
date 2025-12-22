import { NotFoundException } from '@nestjs/common';
import { GetAgentUseCase } from './get-agent.use-case';
import { IAgentRepository } from '../../ports/agent.repository.port';
import { Agent } from '@ursly/shared/types';

describe('GetAgentUseCase', () => {
  let useCase: GetAgentUseCase;
  let mockAgentRepository: jest.Mocked<IAgentRepository>;

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

    useCase = new GetAgentUseCase(mockAgentRepository);
  });

  it('should return an agent when found', async () => {
    mockAgentRepository.findById.mockResolvedValue(mockAgent);

    const result = await useCase.execute({ id: mockAgent.id });

    expect(result.agent).toEqual(mockAgent);
    expect(mockAgentRepository.findById).toHaveBeenCalledWith(mockAgent.id);
  });

  it('should throw NotFoundException when agent not found', async () => {
    mockAgentRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute({ id: 'nonexistent-id' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
