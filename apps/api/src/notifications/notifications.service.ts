import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Novu } from '@novu/api';

export type NotificationChannel = 'in_app' | 'email' | 'push';

export interface SendNotificationOptions {
  subscriberId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  workflowId: string;
  payload?: Record<string, unknown>;
  overrides?: {
    email?: {
      to?: string[];
      subject?: string;
    };
  };
}

export interface CreateSubscriberOptions {
  subscriberId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private novu: Novu | null = null;

  constructor(
    @Optional()
    @Inject(ConfigService)
    private readonly configService: ConfigService | null,
  ) {
    const secretKey = this.configService?.get<string>('NOVU_API_KEY');
    if (secretKey) {
      this.novu = new Novu({ secretKey });
      this.logger.log('Novu notification service initialized');
    } else {
      this.logger.warn('NOVU_API_KEY not configured - notifications disabled');
    }
  }

  async createOrUpdateSubscriber(
    options: CreateSubscriberOptions,
  ): Promise<void> {
    if (!this.novu) return;

    try {
      await this.novu.subscribers.create({
        subscriberId: options.subscriberId,
        email: options.email,
        firstName: options.firstName,
        lastName: options.lastName,
        avatar: options.avatar,
        data: options.data as
          | Record<string, string | number | boolean | string[]>
          | undefined,
      });
      this.logger.debug(`Subscriber ${options.subscriberId} created/updated`);
    } catch (error) {
      this.logger.error(
        `Failed to create subscriber: ${error.message}`,
        error.stack,
      );
    }
  }

  async deleteSubscriber(subscriberId: string): Promise<void> {
    if (!this.novu) return;

    try {
      await this.novu.subscribers.delete(subscriberId);
      this.logger.debug(`Subscriber ${subscriberId} deleted`);
    } catch (error) {
      this.logger.error(
        `Failed to delete subscriber: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendNotification(options: SendNotificationOptions): Promise<void> {
    if (!this.novu) {
      this.logger.warn('Novu not configured - notification not sent');
      return;
    }

    try {
      await this.novu.trigger({
        workflowId: options.workflowId,
        to: {
          subscriberId: options.subscriberId,
          email: options.email,
          firstName: options.firstName,
          lastName: options.lastName,
        },
        payload: (options.payload || {}) as Record<
          string,
          string | number | boolean | string[] | Record<string, unknown>
        >,
        overrides: options.overrides,
      });
      this.logger.debug(
        `Notification ${options.workflowId} sent to ${options.subscriberId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send notification: ${error.message}`,
        error.stack,
      );
    }
  }

  async notifyAgentStatusChange(
    subscriberId: string,
    email: string,
    agentName: string,
    status: string,
    previousStatus: string,
  ): Promise<void> {
    await this.sendNotification({
      subscriberId,
      email,
      workflowId: 'agent-status-changed',
      payload: {
        agentName,
        status,
        previousStatus,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async notifyAgentCreated(
    subscriberId: string,
    email: string,
    agentName: string,
    agentId: string,
  ): Promise<void> {
    await this.sendNotification({
      subscriberId,
      email,
      workflowId: 'agent-created',
      payload: {
        agentName,
        agentId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async notifyTaskStarted(
    subscriberId: string,
    taskId: string,
    taskPrompt: string,
    agentId: string,
  ): Promise<void> {
    await this.sendNotification({
      subscriberId,
      workflowId: 'task-started',
      payload: {
        taskId,
        taskPrompt:
          taskPrompt.substring(0, 100) + (taskPrompt.length > 100 ? '...' : ''),
        agentId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async notifyTaskCompleted(
    subscriberId: string,
    taskId: string,
    taskPrompt: string,
    agentId: string,
    duration: number,
  ): Promise<void> {
    await this.sendNotification({
      subscriberId,
      workflowId: 'task-completed',
      payload: {
        taskId,
        taskPrompt:
          taskPrompt.substring(0, 100) + (taskPrompt.length > 100 ? '...' : ''),
        agentId,
        duration: `${(duration / 1000).toFixed(1)}s`,
        result: 'success',
        timestamp: new Date().toISOString(),
      },
    });
  }

  async notifyTaskFailed(
    subscriberId: string,
    taskId: string,
    taskPrompt: string,
    agentId: string,
    error: string,
    duration: number,
  ): Promise<void> {
    await this.sendNotification({
      subscriberId,
      workflowId: 'task-failed',
      payload: {
        taskId,
        taskPrompt:
          taskPrompt.substring(0, 100) + (taskPrompt.length > 100 ? '...' : ''),
        agentId,
        error,
        duration: `${(duration / 1000).toFixed(1)}s`,
        result: 'failed',
        timestamp: new Date().toISOString(),
      },
    });
  }

  async notifyTaskCancelled(
    subscriberId: string,
    taskId: string,
    taskPrompt: string,
    agentId: string,
  ): Promise<void> {
    await this.sendNotification({
      subscriberId,
      workflowId: 'task-cancelled',
      payload: {
        taskId,
        taskPrompt:
          taskPrompt.substring(0, 100) + (taskPrompt.length > 100 ? '...' : ''),
        agentId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async notifyAccessGranted(
    subscriberId: string,
    email: string,
    organizationName: string,
    groupNames: string[],
  ): Promise<void> {
    await this.sendNotification({
      subscriberId,
      email,
      workflowId: 'access-granted',
      payload: {
        organizationName,
        groupNames,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async notifyAccessRevoked(
    subscriberId: string,
    email: string,
    organizationName: string,
    reason?: string,
  ): Promise<void> {
    await this.sendNotification({
      subscriberId,
      email,
      workflowId: 'access-revoked',
      payload: {
        organizationName,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async notifyPasswordReset(
    subscriberId: string,
    email: string,
    resetLink: string,
    expiresIn: string,
  ): Promise<void> {
    await this.sendNotification({
      subscriberId,
      email,
      workflowId: 'password-reset',
      payload: {
        resetLink,
        expiresIn,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async notifyWelcome(
    subscriberId: string,
    email: string,
    firstName: string,
    organizationName: string,
  ): Promise<void> {
    await this.sendNotification({
      subscriberId,
      email,
      workflowId: 'welcome',
      payload: {
        firstName,
        organizationName,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async notifyInvitation(
    email: string,
    inviterName: string,
    organizationName: string,
    inviteLink: string,
  ): Promise<void> {
    await this.sendNotification({
      subscriberId: email,
      email,
      workflowId: 'invitation',
      payload: {
        inviterName,
        organizationName,
        inviteLink,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async notifySecurityAlert(
    subscriberId: string,
    email: string,
    alertType:
      | 'new_login'
      | 'password_changed'
      | 'permissions_changed'
      | 'suspicious_activity',
    details: Record<string, unknown>,
  ): Promise<void> {
    await this.sendNotification({
      subscriberId,
      email,
      workflowId: 'security-alert',
      payload: {
        alertType,
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
