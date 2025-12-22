import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IAgentRepository, AGENT_REPOSITORY } from '../../ports/agent.repository.port';
import { IAuditLogRepository, AUDIT_LOG_REPOSITORY } from '../../ports/audit-log.repository.port';

export interface DeleteAgentInput {
  id: string;
  userId: string;
}

export interface DeleteAgentOutput {
  success: boolean;
}

@Injectable()
export class DeleteAgentUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: IAgentRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async execute(input: DeleteAgentInput): Promise<DeleteAgentOutput> {
    // Check if agent exists
    const exists = await this.agentRepository.exists(input.id);
    if (!exists) {
      throw new NotFoundException(`Agent with ID '${input.id}' not found`);
    }

    // Delete the agent
    const success = await this.agentRepository.delete(input.id);

    // Log the audit event
    if (success) {
      await this.auditLogRepository.create({
        eventType: 'agent_deleted',
        agentId: input.id,
        userId: input.userId,
      });
    }

    return { success };
  }
}

