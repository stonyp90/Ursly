import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TokenExchangeDto {
  @ApiProperty({ description: 'Keycloak bearer token' })
  @IsString()
  @IsNotEmpty()
  keycloakToken: string;

  @ApiProperty({ description: 'Agent ID to generate token for' })
  @IsString()
  @IsNotEmpty()
  agentId: string;
}

