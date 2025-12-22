import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  Agent,
  UpdateAgentDto,
  UpdateAgentDtoSchema,
} from '@ursly/shared/types';
import {
  IAgentRepository,
  AGENT_REPOSITORY,
} from '../../ports/agent.repository.port';
import {
  IAuditLogRepository,
  AUDIT_LOG_REPOSITORY,
} from '../../ports/audit-log.repository.port';
import {
  IOllamaService,
  OLLAMA_SERVICE,
} from '../../ports/ollama.service.port';

export interface UpdateAgentInput {
  id: string;
  dto: UpdateAgentDto;
  userId: string;
}

export interface UpdateAgentOutput {
  agent: Agent;
}

@Injectable()
export class UpdateAgentUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: IAgentRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
    @Inject(OLLAMA_SERVICE)
    private readonly ollamaService: IOllamaService,
  ) {}

  async execute(input: UpdateAgentInput): Promise<UpdateAgentOutput> {
    // Validate input with Zod
    const validatedDto = UpdateAgentDtoSchema.parse(input.dto);

    // Check if agent exists
    const exists = await this.agentRepository.exists(input.id);
    if (!exists) {
      throw new NotFoundException(`Agent with ID '${input.id}' not found`);
    }

    // If model is being updated, verify it exists
    if (validatedDto.model) {
      const modelExists = await this.ollamaService.hasModel(validatedDto.model);
      if (!modelExists) {
        throw new Error(
          `Model '${validatedDto.model}' is not available in Ollama`,
        );
      }
    }

    // Update the agent
    const agent = await this.agentRepository.update(input.id, validatedDto);
    if (!agent) {
      throw new NotFoundException(`Agent with ID '${input.id}' not found`);
    }

    // Log the audit event
    await this.auditLogRepository.create({
      eventType: 'agent_updated',
      agentId: agent.id,
      userId: input.userId,
      metadata: { updates: Object.keys(validatedDto) },
    });

    return { agent };
  }
}
