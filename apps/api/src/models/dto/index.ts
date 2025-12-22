import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PullModelDto {
  @ApiProperty({ description: 'Model name to pull (e.g., llama2, mistral)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Allow insecure connections' })
  @IsBoolean()
  @IsOptional()
  insecure?: boolean;

  @ApiPropertyOptional({ description: 'Stream progress updates' })
  @IsBoolean()
  @IsOptional()
  stream?: boolean;
}

