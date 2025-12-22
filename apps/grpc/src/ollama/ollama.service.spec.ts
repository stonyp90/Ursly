import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { OllamaService } from './ollama.service';
import { AuditService } from '../audit/audit.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OllamaService (gRPC)', () => {
  let service: OllamaService;
  let mockAuditService: jest.Mocked<AuditService>;

  const mockModels = {
    models: [
      { name: 'llama2', size: 3826793472, digest: 'abc123' },
      { name: 'codellama', size: 3826793472, digest: 'def456' },
    ],
  };

  beforeEach(async () => {
    mockAuditService = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaService,
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<OllamaService>(OllamaService);
    jest.clearAllMocks();
  });

  describe('listModels', () => {
    it('should return list of models', async () => {
      mockedAxios.get.mockResolvedValue({ data: mockModels });

      const result = await service.listModels();

      expect(result.models).toHaveLength(2);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/tags')
      );
    });

    it('should throw error when Ollama is unavailable', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      await expect(service.listModels()).rejects.toThrow();
    });
  });

  describe('deleteModel', () => {
    it('should delete a model successfully', async () => {
      mockedAxios.delete.mockResolvedValue({});

      const result = await service.deleteModel({ name: 'llama2' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');
    });

    it('should return failure on delete error', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('Model not found'));

      const result = await service.deleteModel({ name: 'nonexistent' });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Model not found');
    });
  });

  describe('showModelInfo', () => {
    it('should return model info', async () => {
      const modelInfo = {
        modelfile: 'FROM llama2',
        parameters: { temperature: 0.7 },
        template: '{{ .Prompt }}',
        details: { families: ['llama'] },
      };
      mockedAxios.post.mockResolvedValue({ data: modelInfo });

      const result = await service.showModelInfo({ name: 'llama2' });

      expect(result).toBeDefined();
      expect(result.modelfile).toBe('FROM llama2');
    });

    it('should throw error when model not found', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Model not found'));

      await expect(service.showModelInfo({ name: 'nonexistent' })).rejects.toThrow();
    });
  });
});

