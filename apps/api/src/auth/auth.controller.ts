import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TokenExchangeDto } from './dto/token-exchange.dto';
import { NotificationsService } from '../notifications/notifications.service';

interface SyncSubscriberDto {
  subscriberId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post('exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Keycloak token for agent token' })
  @ApiResponse({ status: 200, description: 'Token exchanged successfully' })
  @ApiResponse({ status: 401, description: 'Invalid Keycloak token' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  @ApiBearerAuth()
  async exchangeToken(@Body() dto: TokenExchangeDto) {
    return this.authService.exchangeToken(dto);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate agent token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async validateToken(@Body() body: { token: string }) {
    return this.authService.validateAgentToken(body.token);
  }

  @Post('sync-subscriber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync user as Novu subscriber for notifications' })
  @ApiResponse({ status: 200, description: 'Subscriber synced successfully' })
  @ApiBearerAuth()
  async syncSubscriber(@Body() dto: SyncSubscriberDto) {
    await this.notificationsService.createOrUpdateSubscriber({
      subscriberId: dto.subscriberId,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      avatar: dto.avatar,
    });
    return { success: true };
  }
}

