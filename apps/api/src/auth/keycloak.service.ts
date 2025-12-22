import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { KeycloakUser } from '@ursly/shared/types';

@Injectable()
export class KeycloakService {
  private readonly keycloakUrl: string;
  private readonly realm: string;

  constructor(private configService: ConfigService) {
    this.keycloakUrl =
      this.configService.get<string>('KEYCLOAK_URL') || 'http://keycloak:8080';
    this.realm =
      this.configService.get<string>('KEYCLOAK_REALM') || 'agent-orchestrator';
  }

  async validateToken(token: string): Promise<KeycloakUser | null> {
    try {
      const userInfoUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`;

      const response = await axios.get(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data as KeycloakUser;
    } catch (error) {
      console.error('Failed to validate Keycloak token:', error.message);
      return null;
    }
  }

  async introspectToken(token: string): Promise<any> {
    try {
      const introspectUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token/introspect`;
      const clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'KEYCLOAK_CLIENT_SECRET',
      );

      const response = await axios.post(
        introspectUrl,
        new URLSearchParams({
          token,
          client_id: clientId,
          client_secret: clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Failed to introspect token:', error.message);
      throw new UnauthorizedException('Token introspection failed');
    }
  }
}
