import { Agent } from './agent.entity';
import { AgentName } from '../value-objects/agent-name.vo';
import { ModelName } from '../value-objects/model-name.vo';
import { SystemPrompt } from '../value-objects/system-prompt.vo';
import { AgentStatus } from '../value-objects/agent-status.vo';

describe('Agent Entity', () => {
  describe('create', () => {
    it('should create a new agent with active status', () => {
      const agent = Agent.create(
        AgentName.create('Test Agent'),
        ModelName.create('llama2'),
        SystemPrompt.create('You are a helpful assistant'),
        'user-123'
      );

      expect(agent.name.value).toBe('Test Agent');
      expect(agent.model.value).toBe('llama2');
      expect(agent.status.isActive()).toBe(true);
      expect(agent.createdBy).toBe('user-123');
    });

    it('should create agent with capabilities', () => {
      const agent = Agent.create(
        AgentName.create('Test Agent'),
        ModelName.create('llama2'),
        SystemPrompt.create('You are a helpful assistant'),
        'user-123',
        ['text-generation', 'summarization']
      );

      expect(agent.capabilities).toEqual(['text-generation', 'summarization']);
    });
  });

  describe('business methods', () => {
    let agent: Agent;

    beforeEach(() => {
      agent = Agent.create(
        AgentName.create('Test Agent'),
        ModelName.create('llama2'),
        SystemPrompt.create('You are a helpful assistant'),
        'user-123'
      );
    });

    it('should update name', () => {
      agent.updateName(AgentName.create('Updated Agent'));
      expect(agent.name.value).toBe('Updated Agent');
    });

    it('should activate agent', () => {
      agent.suspend();
      agent.activate();
      expect(agent.status.isActive()).toBe(true);
    });

    it('should suspend agent', () => {
      agent.suspend();
      expect(agent.status.isSuspended()).toBe(true);
    });

    it('should stop agent', () => {
      agent.stop();
      expect(agent.status.isStopped()).toBe(true);
    });

    it('should only execute tasks when active', () => {
      expect(agent.canExecuteTask()).toBe(true);
      
      agent.suspend();
      expect(agent.canExecuteTask()).toBe(false);
      
      agent.stop();
      expect(agent.canExecuteTask()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize to plain object', () => {
      const agent = Agent.create(
        AgentName.create('Test Agent'),
        ModelName.create('llama2'),
        SystemPrompt.create('You are a helpful assistant'),
        'user-123'
      );

      const json = agent.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('name', 'Test Agent');
      expect(json).toHaveProperty('model', 'llama2');
      expect(json).toHaveProperty('status', 'active');
    });
  });
});

