import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ModelsService } from './models.service';
import { AuditService } from '../audit/audit.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ModelsService', () => {
  let service: ModelsService;
  let mockAuditService: jest.Mocked<AuditService>;

  const mockModels = {
    models: [
      { name: 'llama2', size: 3826793472, digest: 'abc123' },
      { name: 'codellama', size: 3826793472, digest: 'def456' },
    ],
  };

  beforeEach(async () => {
    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:11434'),
          },
        },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ModelsService>(ModelsService);
    jest.clearAllMocks();
  });

  describe('listModels', () => {
    it('should return list of models from Ollama', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockModels });

      const result = await service.listModels();

      expect(result.models).toHaveLength(2);
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:11434/api/tags');
    });

    it('should throw error when Ollama is unavailable', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      await expect(service.listModels()).rejects.toThrow('Failed to retrieve models from Ollama');
    });
  });

  describe('pullModel', () => {
    it('should pull a model successfully', async () => {
      mockedAxios.post.mockResolvedValue({ data: { status: 'success' } });

      const result = await service.pullModel({ name: 'llama2' });

      expect(result.status).toBe('Model pull completed');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:11434/api/pull',
        expect.objectContaining({ name: 'llama2' })
      );
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw error on pull failure', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Pull failed'));

      await expect(service.pullModel({ name: 'invalid-model' })).rejects.toThrow(
        'Failed to pull model from Ollama'
      );
    });
  });

  describe('deleteModel', () => {
    it('should delete a model successfully', async () => {
      mockedAxios.delete.mockResolvedValue({ data: { status: 'success' } });

      const result = await service.deleteModel('llama2');

      expect(result.status).toBe('Model deleted successfully');
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'http://localhost:11434/api/delete',
        { data: { name: 'llama2' } }
      );
    });

    it('should throw error on delete failure', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteModel('nonexistent')).rejects.toThrow(
        'Failed to delete model from Ollama'
      );
    });
  });

  describe('showModel', () => {
    it('should return model info', async () => {
      const modelInfo = { name: 'llama2', parameters: '7B' };
      mockedAxios.post.mockResolvedValue({ data: modelInfo });

      const result = await service.showModel('llama2');

      expect(result).toEqual(modelInfo);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:11434/api/show',
        { name: 'llama2' }
      );
    });
  });
});

