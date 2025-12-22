import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  Agent,
  CreateAgentDto,
  UpdateAgentDto,
  QueryAgentDto,
  AgentListResponse,
} from '@ursly/shared/types';
import { IAgentRepository } from '../../../application/ports/agent.repository.port';

interface AgentDocument {
  _id: string;
  name: string;
  model: string;
  systemPrompt: string;
  status: string;
  capabilities: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class AgentRepositoryAdapter implements IAgentRepository {
  constructor(
    @InjectModel('Agent') private readonly agentModel: Model<AgentDocument>,
  ) {}

  async create(dto: CreateAgentDto, createdBy: string): Promise<Agent> {
    const now = new Date();
    const agent = new this.agentModel({
      _id: uuidv4(),
      ...dto,
      status: 'active',
      capabilities: dto.capabilities || [],
      createdBy,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await agent.save();
    return this.toAgent(saved);
  }

  async findById(id: string): Promise<Agent | null> {
    const doc = await this.agentModel.findById(id).lean().exec();
    return doc ? this.toAgent(doc as AgentDocument) : null;
  }

  async findAll(query: QueryAgentDto): Promise<AgentListResponse> {
    const filter: Record<string, any> = {};
    if (query.status) {
      filter.status = query.status;
    }

    const [agents, total] = await Promise.all([
      this.agentModel
        .find(filter)
        .skip(query.offset)
        .limit(query.limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.agentModel.countDocuments(filter).exec(),
    ]);

    return {
      agents: agents.map((a) => this.toAgent(a as AgentDocument)),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async update(id: string, dto: UpdateAgentDto): Promise<Agent | null> {
    const doc = await this.agentModel
      .findByIdAndUpdate(id, { ...dto, updatedAt: new Date() }, { new: true })
      .lean()
      .exec();

    return doc ? this.toAgent(doc as AgentDocument) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.agentModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.agentModel.countDocuments({ _id: id }).exec();
    return count > 0;
  }

  private toAgent(doc: AgentDocument): Agent {
    return {
      id: doc._id,
      name: doc.name,
      model: doc.model,
      systemPrompt: doc.systemPrompt,
      status: doc.status as 'active' | 'suspended' | 'stopped',
      capabilities: doc.capabilities,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      metadata: doc.metadata,
    };
  }
}
