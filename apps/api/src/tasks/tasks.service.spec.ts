import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { TasksService } from './tasks.service';
import { AuditService } from '../audit/audit.service';
import { TasksGateway } from './tasks.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let mockTaskModel: any;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockTasksGateway: jest.Mocked<TasksGateway>;

  const mockTask = {
    _id: '507f1f77bcf86cd799439011',
    id: '507f1f77bcf86cd799439011',
    name: 'Test Task',
    agentId: 'agent-123',
    status: 'pending',
    prompt: 'Test prompt',
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: jest.fn().mockReturnThis(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockTaskModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: mockTask._id,
      save: jest
        .fn()
        .mockResolvedValue({ ...mockTask, toJSON: () => mockTask }),
      toJSON: () => mockTask,
    }));

    mockTaskModel.find = jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockTask]),
    });

    mockTaskModel.findById = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockTask),
    });

    mockTaskModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockTask),
    });

    mockTaskModel.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockTask),
    });

    mockTaskModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockTasksGateway = {
      emitTaskUpdate: jest.fn(),
    } as any;

    const mockNotificationsService = {
      notifyTaskCompleted: jest.fn().mockResolvedValue(undefined),
      notifyTaskFailed: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getModelToken('Task'), useValue: mockTaskModel },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:11434'),
          },
        },
        { provide: AuditService, useValue: mockAuditService },
        { provide: TasksGateway, useValue: mockTasksGateway },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const dto = {
        agentId: 'agent-123',
        prompt: 'Test prompt',
      };

      const result = await service.create(dto, 'user-123');

      expect(result).toBeDefined();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'task_started' }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const result = await service.findAll({ limit: 10, offset: 0 });

      expect(result.tasks).toBeDefined();
      expect(result.total).toBe(1);
    });

    it('should filter by agentId', async () => {
      await service.findAll({ agentId: 'agent-123' });

      expect(mockTaskModel.find).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      await service.findAll({ status: 'pending' });

      expect(mockTaskModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockTask._id.toString());
    });

    it('should throw NotFoundException when task not found', async () => {
      mockTaskModel.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a task', async () => {
      const result = await service.cancel('507f1f77bcf86cd799439011');

      expect(result).toBeDefined();
      expect(mockTaskModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(mockTasksGateway.emitTaskUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({ type: 'status' }),
      );
    });

    it('should throw NotFoundException when task not found', async () => {
      mockTaskModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.cancel('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
