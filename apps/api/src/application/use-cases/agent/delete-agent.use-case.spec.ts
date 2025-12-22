import { NotFoundException } from '@nestjs/common';
import { DeleteAgentUseCase } from './delete-agent.use-case';
import { IAgentRepository } from '../../ports/agent.repository.port';
import { IAuditLogRepository } from '../../ports/audit-log.repository.port';

describe('DeleteAgentUseCase', () => {
  let useCase: DeleteAgentUseCase;
  let mockAgentRepository: jest.Mocked<IAgentRepository>;
  let mockAuditLogRepository: jest.Mocked<IAuditLogRepository>;

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

    useCase = new DeleteAgentUseCase(mockAgentRepository, mockAuditLogRepository);
  });

  it('should delete an agent successfully', async () => {
    mockAgentRepository.exists.mockResolvedValue(true);
    mockAgentRepository.delete.mockResolvedValue(true);
    mockAuditLogRepository.create.mockResolvedValue({} as any);

    const result = await useCase.execute({
      id: 'agent-123',
      userId: 'user-123',
    });

    expect(result.success).toBe(true);
    expect(mockAgentRepository.delete).toHaveBeenCalledWith('agent-123');
    expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'agent_deleted',
        agentId: 'agent-123',
        userId: 'user-123',
      }),
    );
  });

  it('should throw NotFoundException when agent does not exist', async () => {
    mockAgentRepository.exists.mockResolvedValue(false);

    await expect(
      useCase.execute({
        id: 'nonexistent-id',
        userId: 'user-123',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(mockAgentRepository.delete).not.toHaveBeenCalled();
  });

  it('should not log audit when delete fails', async () => {
    mockAgentRepository.exists.mockResolvedValue(true);
    mockAgentRepository.delete.mockResolvedValue(false);

    const result = await useCase.execute({
      id: 'agent-123',
      userId: 'user-123',
    });

    expect(result.success).toBe(false);
    expect(mockAuditLogRepository.create).not.toHaveBeenCalled();
  });
});

