import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { KeycloakService } from './keycloak.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AgentTokenModel } from '@ursly/audit-logger';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: 'AgentToken', schema: AgentTokenModel.schema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('AGENT_TOKEN_SECRET'),
        signOptions: {
          expiresIn: `${configService.get<number>('AGENT_TOKEN_EXPIRY')}s`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    KeycloakService,
    JwtAuthGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService, KeycloakService, JwtAuthGuard],
})
export class AuthModule {}
