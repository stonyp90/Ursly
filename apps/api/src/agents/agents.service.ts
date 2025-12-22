import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgentDocument } from '@ursly/audit-logger';
import {
  Agent,
  AgentStatus,
  AgentStatusEnum,
  CreateAgentDto,
  UpdateAgentDto,
} from '@ursly/shared/types';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AgentsService {
  constructor(
    @InjectModel('Agent') private agentModel: Model<AgentDocument>,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateAgentDto, userId: string): Promise<Agent> {
    const agent = new this.agentModel({
      ...dto,
      createdBy: userId,
      status: AgentStatusEnum.ACTIVE,
    });

    const saved = await agent.save();

    // Audit log
    await this.auditService.log({
      eventType: 'agent_created',
      agentId: saved.id,
      userId,
      metadata: { name: dto.name, model: dto.model },
    });

    return saved.toJSON() as unknown as Agent;
  }

  async findAll(query: { status?: string; limit?: number; offset?: number }) {
    const filter: any = {};
    if (query.status) {
      filter.status = query.status;
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const [agents, total] = await Promise.all([
      this.agentModel
        .find(filter)
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.agentModel.countDocuments(filter).exec(),
    ]);

    return {
      agents: agents.map((a) => ({ ...a, id: a._id.toString() })) as Agent[],
      total,
      hasMore: offset + agents.length < total,
    };
  }

  async findOne(id: string): Promise<Agent> {
    const agent = await this.agentModel.findById(id).lean().exec();
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }
    return { ...agent, id: agent._id.toString() } as Agent;
  }

  async update(id: string, dto: UpdateAgentDto): Promise<Agent> {
    const agent = await this.agentModel
      .findByIdAndUpdate(id, dto, { new: true })
      .lean()
      .exec();

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    // Audit log
    await this.auditService.log({
      eventType: 'agent_updated',
      agentId: id,
      metadata: dto,
    });

    return { ...agent, id: agent._id.toString() } as Agent;
  }

  async remove(id: string): Promise<void> {
    const result = await this.agentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    // Audit log
    await this.auditService.log({
      eventType: 'agent_deleted',
      agentId: id,
      metadata: { name: result.name },
    });
  }

  async changeStatus(id: string, status: string): Promise<Agent> {
    return this.update(id, { status: status as AgentStatus });
  }
}
