import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto } from './dto';

@ApiTags('Agents')
@Controller('agents')
@ApiBearerAuth()
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  async create(@Body() dto: CreateAgentDto) {
    return this.agentsService.create(dto, 'user-id'); // TODO: Extract from auth token
  }

  @Get()
  @ApiOperation({ summary: 'List all agents' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async findAll(
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.agentsService.findAll({ status, limit, offset });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiResponse({ status: 200, description: 'Agent found' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update agent' })
  @ApiResponse({ status: 200, description: 'Agent updated successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete agent' })
  @ApiResponse({ status: 204, description: 'Agent deleted successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async remove(@Param('id') id: string) {
    await this.agentsService.remove(id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start agent' })
  async start(@Param('id') id: string) {
    return this.agentsService.changeStatus(id, 'active');
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop agent' })
  async stop(@Param('id') id: string) {
    return this.agentsService.changeStatus(id, 'stopped');
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend agent' })
  async suspend(@Param('id') id: string) {
    return this.agentsService.changeStatus(id, 'suspended');
  }
}

