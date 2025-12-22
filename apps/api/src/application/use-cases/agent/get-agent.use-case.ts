import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Agent } from '@ursly/shared/types';
import {
  IAgentRepository,
  AGENT_REPOSITORY,
} from '../../ports/agent.repository.port';

export interface GetAgentInput {
  id: string;
}

export interface GetAgentOutput {
  agent: Agent;
}

@Injectable()
export class GetAgentUseCase {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: IAgentRepository,
  ) {}

  async execute(input: GetAgentInput): Promise<GetAgentOutput> {
    const agent = await this.agentRepository.findById(input.id);

    if (!agent) {
      throw new NotFoundException(`Agent with ID '${input.id}' not found`);
    }

    return { agent };
  }
}
