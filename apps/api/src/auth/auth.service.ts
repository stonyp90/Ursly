import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KeycloakService } from './keycloak.service';
import { TokenExchangeDto } from './dto/token-exchange.dto';
import { AgentTokenDocument } from '@ursly/audit-logger';
import { AgentTokenPayload, TokenExchangeResponse } from '@ursly/shared/types';

@Injectable()
export class AuthService {
  private readonly tokenExpiry: number;

  constructor(
    @InjectModel('AgentToken')
    private agentTokenModel: Model<AgentTokenDocument>,
    private jwtService: JwtService,
    private keycloakService: KeycloakService,
    private configService: ConfigService,
  ) {
    this.tokenExpiry =
      this.configService.get<number>('AGENT_TOKEN_EXPIRY') || 300;
  }

  async exchangeToken(dto: TokenExchangeDto): Promise<TokenExchangeResponse> {
    // Validate Keycloak token
    const keycloakUser = await this.keycloakService.validateToken(
      dto.keycloakToken,
    );

    if (!keycloakUser) {
      throw new UnauthorizedException('Invalid Keycloak token');
    }

    // Generate agent token
    const payload: AgentTokenPayload = {
      agentId: dto.agentId,
      userId: keycloakUser.sub,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.tokenExpiry,
    };

    const agentToken = this.jwtService.sign(payload);

    // Store token in database
    const tokenDoc = new this.agentTokenModel({
      agentId: dto.agentId,
      token: agentToken,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + this.tokenExpiry * 1000),
      userId: keycloakUser.sub,
    });

    await tokenDoc.save();

    return {
      agentToken,
      expiresIn: this.tokenExpiry,
      agentId: dto.agentId,
    };
  }

  async validateAgentToken(token: string): Promise<AgentTokenPayload> {
    try {
      const payload = this.jwtService.verify<AgentTokenPayload>(token);

      // Check if token exists in database and hasn't been revoked
      const tokenDoc = await this.agentTokenModel
        .findOne({
          token,
          expiresAt: { $gt: new Date() },
        })
        .exec();

      if (!tokenDoc) {
        throw new UnauthorizedException('Token not found or expired');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async revokeToken(token: string): Promise<void> {
    await this.agentTokenModel.deleteOne({ token }).exec();
  }

  async revokeAllAgentTokens(agentId: string): Promise<number> {
    const result = await this.agentTokenModel.deleteMany({ agentId }).exec();
    return result.deletedCount || 0;
  }
}
