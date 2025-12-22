import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsObject,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AgentStatus } from '@ursly/shared/types';

const AgentStatusValues = ['active', 'suspended', 'stopped'] as const;

export class CreateAgentDto {
  @ApiProperty({ description: 'Agent name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Ollama model to use' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ description: 'System prompt for the agent' })
  @IsString()
  @IsNotEmpty()
  systemPrompt: string;

  @ApiPropertyOptional({ description: 'Agent capabilities', type: [String] })
  @IsArray()
  @IsOptional()
  capabilities?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateAgentDto {
  @ApiPropertyOptional({ description: 'Agent name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Ollama model to use' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ description: 'System prompt for the agent' })
  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @ApiPropertyOptional({ description: 'Agent status', enum: AgentStatusValues })
  @IsIn(AgentStatusValues)
  @IsOptional()
  status?: AgentStatus;

  @ApiPropertyOptional({ description: 'Agent capabilities', type: [String] })
  @IsArray()
  @IsOptional()
  capabilities?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
