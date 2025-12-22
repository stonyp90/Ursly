import { Inject, Injectable } from '@nestjs/common';
import {
  Agent,
  CreateAgentDto,
  CreateAgentDtoSchema,
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

export interface CreateAgentInput {
  dto: CreateAgentDto;
  userId: string;
}

export interface CreateAgentOutput {
  agent: Agent;
}

@Injectable()
export class CreateAgentUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: IAgentRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
    @Inject(OLLAMA_SERVICE)
    private readonly ollamaService: IOllamaService,
  ) {}

  async execute(input: CreateAgentInput): Promise<CreateAgentOutput> {
    // Validate input with Zod
    const validatedDto = CreateAgentDtoSchema.parse(input.dto);

    // Verify the model exists in Ollama
    const modelExists = await this.ollamaService.hasModel(validatedDto.model);
    if (!modelExists) {
      throw new Error(
        `Model '${validatedDto.model}' is not available in Ollama`,
      );
    }

    // Create the agent
    const agent = await this.agentRepository.create(validatedDto, input.userId);

    // Log the audit event
    await this.auditLogRepository.create({
      eventType: 'agent_created',
      agentId: agent.id,
      userId: input.userId,
      metadata: { agentName: agent.name, model: agent.model },
    });

    return { agent };
  }
}
