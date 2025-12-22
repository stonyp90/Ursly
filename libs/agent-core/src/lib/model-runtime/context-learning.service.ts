import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IContextLearningService,
  IRAGService,
  RAG_SERVICE,
  RAGDocument,
  RAGQueryOptions,
  ContextLearningConfig,
} from './model-runtime.types';

/**
 * Learned knowledge entry
 */
interface KnowledgeEntry {
  id: string;
  agentId: string;
  type: 'conversation' | 'summary' | 'insight' | 'preference';
  content: string;
  metadata: Record<string, unknown>;
  learnedAt: Date;
}

/**
 * Agent learning statistics
 */
interface AgentLearningStats {
  agentId: string;
  documentCount: number;
  conversationCount: number;
  insightCount: number;
  lastLearnedAt?: Date;
}

/**
 * Context Learning Service
 * 
 * Enables agents to learn from conversation history:
 * - Extracts knowledge from past conversations
 * - Stores learned context for future retrieval
 * - Identifies patterns and preferences
 * - Builds agent-specific knowledge bases
 */
@Injectable()
export class ContextLearningService implements IContextLearningService {
  private readonly logger = new Logger(ContextLearningService.name);
  private readonly knowledge: Map<string, KnowledgeEntry[]> = new Map();
  private readonly stats: Map<string, AgentLearningStats> = new Map();
  
  private config: ContextLearningConfig = {
    enabled: true,
    minMessages: 4,
    storeEmbeddings: true,
    summarize: true,
  };

  constructor(
    @Optional()
    @Inject(RAG_SERVICE)
    private readonly ragService?: IRAGService,
  ) {
    this.logger.log('Context Learning Service initialized');
  }

  /**
   * Configure learning behavior
   */
  configure(config: Partial<ContextLearningConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log(`Learning config updated: ${JSON.stringify(this.config)}`);
  }

  /**
   * Learn from a conversation
   * Extracts knowledge, insights, and patterns
   */
  async learnFromConversation(
    agentId: string,
    messages: Array<{ role: string; content: string }>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    if (messages.length < this.config.minMessages) {
      this.logger.debug(`Skipping learning: only ${messages.length} messages (min: ${this.config.minMessages})`);
      return;
    }

    this.logger.log(`Learning from conversation for agent ${agentId} (${messages.length} messages)`);

    // Initialize stats for agent
    if (!this.stats.has(agentId)) {
      this.stats.set(agentId, {
        agentId,
        documentCount: 0,
        conversationCount: 0,
        insightCount: 0,
      });
    }

    const stats = this.stats.get(agentId)!;

    try {
      // 1. Extract key information from conversation
      const insights = this.extractInsights(messages);
      
      // 2. Create summary if enabled
      let summary = '';
      if (this.config.summarize) {
        summary = this.createConversationSummary(messages);
      }

      // 3. Store conversation as knowledge entry
      const conversationEntry: KnowledgeEntry = {
        id: uuidv4(),
        agentId,
        type: 'conversation',
        content: messages.map(m => `[${m.role}]: ${m.content}`).join('\n'),
        metadata: {
          ...metadata,
          messageCount: messages.length,
          extractedInsights: insights.length,
        },
        learnedAt: new Date(),
      };

      // 4. Store insights as separate entries
      const insightEntries: KnowledgeEntry[] = insights.map(insight => ({
        id: uuidv4(),
        agentId,
        type: 'insight' as const,
        content: insight,
        metadata: {
          source: conversationEntry.id,
          ...metadata,
        },
        learnedAt: new Date(),
      }));

      // 5. Store summary
      const summaryEntry: KnowledgeEntry | null = summary ? {
        id: uuidv4(),
        agentId,
        type: 'summary',
        content: summary,
        metadata: {
          source: conversationEntry.id,
          ...metadata,
        },
        learnedAt: new Date(),
      } : null;

      // 6. Add to local knowledge store
      const agentKnowledge = this.knowledge.get(agentId) || [];
      agentKnowledge.push(conversationEntry, ...insightEntries);
      if (summaryEntry) {
        agentKnowledge.push(summaryEntry);
      }
      this.knowledge.set(agentId, agentKnowledge);

      // 7. Add to RAG if available
      if (this.ragService && this.config.storeEmbeddings) {
        const documents: RAGDocument[] = [
          {
            id: conversationEntry.id,
            content: summary || conversationEntry.content,
            metadata: { agentId, type: 'conversation', ...metadata },
          },
          ...insightEntries.map(e => ({
            id: e.id,
            content: e.content,
            metadata: { agentId, type: 'insight', ...metadata },
          })),
        ];

        await this.ragService.addDocuments(documents);
      }

      // 8. Update stats
      stats.conversationCount++;
      stats.insightCount += insights.length;
      stats.documentCount = agentKnowledge.length;
      stats.lastLearnedAt = new Date();

      this.logger.log(
        `Learned from conversation: ${insights.length} insights, ` +
        `summary: ${summary.length > 0 ? 'yes' : 'no'}`
      );
    } catch (error) {
      this.logger.error(`Failed to learn from conversation: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Extract insights from messages
   */
  private extractInsights(messages: Array<{ role: string; content: string }>): string[] {
    const insights: string[] = [];

    for (const msg of messages) {
      // Extract user preferences
      const preferencePatterns = [
        /I (?:prefer|like|want|need|always|usually)\s+(.+?)(?:\.|$)/gi,
        /(?:please|always|never)\s+(.+?)(?:\.|$)/gi,
        /important(?:\s+to me)?:\s*(.+?)(?:\.|$)/gi,
      ];

      for (const pattern of preferencePatterns) {
        const matches = msg.content.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && match[1].length > 10 && match[1].length < 200) {
            insights.push(`User preference: ${match[1].trim()}`);
          }
        }
      }

      // Extract decisions
      const decisionPatterns = [
        /(?:decided|chosen|going with|will use|opted for)\s+(.+?)(?:\.|$)/gi,
        /(?:decision|conclusion):\s*(.+?)(?:\.|$)/gi,
      ];

      for (const pattern of decisionPatterns) {
        const matches = msg.content.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && match[1].length > 10 && match[1].length < 200) {
            insights.push(`Decision: ${match[1].trim()}`);
          }
        }
      }

      // Extract important facts
      const factPatterns = [
        /(?:fact|note|remember|key point):\s*(.+?)(?:\.|$)/gi,
        /(?:the|my)\s+(\w+)\s+is\s+(.+?)(?:\.|$)/gi,
      ];

      for (const pattern of factPatterns) {
        const matches = msg.content.matchAll(pattern);
        for (const match of matches) {
          const fact = match[2] ? `${match[1]} is ${match[2]}` : match[1];
          if (fact && fact.length > 10 && fact.length < 200) {
            insights.push(`Fact: ${fact.trim()}`);
          }
        }
      }
    }

    // Deduplicate
    return [...new Set(insights)].slice(0, 20);
  }

  /**
   * Create a summary of the conversation
   */
  private createConversationSummary(
    messages: Array<{ role: string; content: string }>
  ): string {
    // Extract key topics
    const topics = new Set<string>();
    const keyPhrases: string[] = [];

    for (const msg of messages) {
      // Extract topics (nouns and noun phrases)
      const words = msg.content.split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = `${words[i]} ${words[i + 1]}`.toLowerCase();
        if (bigram.length > 5 && !this.isStopPhrase(bigram)) {
          topics.add(bigram);
        }
      }

      // Extract key sentences (questions and statements with key words)
      const sentences = msg.content.split(/[.!?]+/);
      for (const sentence of sentences) {
        if (this.isKeySentence(sentence)) {
          keyPhrases.push(sentence.trim());
        }
      }
    }

    // Build summary
    const summaryParts: string[] = [];

    // Topics discussed
    const topicList = Array.from(topics).slice(0, 10);
    if (topicList.length > 0) {
      summaryParts.push(`Topics: ${topicList.join(', ')}`);
    }

    // Key points
    const uniquePhrases = [...new Set(keyPhrases)].slice(0, 5);
    if (uniquePhrases.length > 0) {
      summaryParts.push(`Key points:\n${uniquePhrases.map(p => `- ${p}`).join('\n')}`);
    }

    // User's last question/request
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      const lastUser = userMessages[userMessages.length - 1].content;
      if (lastUser.length < 200) {
        summaryParts.push(`Last request: ${lastUser}`);
      }
    }

    return summaryParts.join('\n\n');
  }

  private isStopPhrase(phrase: string): boolean {
    const stopPhrases = [
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    ];
    const words = phrase.split(' ');
    return words.every(w => stopPhrases.includes(w.toLowerCase()));
  }

  private isKeySentence(sentence: string): boolean {
    const keyIndicators = [
      'important', 'key', 'note', 'remember', 'must', 'should',
      'always', 'never', 'please', 'prefer', 'need', 'want',
      '?', // Questions are often key
    ];
    const lower = sentence.toLowerCase();
    return keyIndicators.some(indicator => lower.includes(indicator));
  }

  /**
   * Get learned context for a query
   * Retrieves relevant knowledge from past conversations
   */
  async getLearnedContext(
    agentId: string,
    query: string,
    options?: RAGQueryOptions
  ): Promise<string> {
    // Try RAG first if available
    if (this.ragService) {
      const documents = await this.ragService.query(query, {
        ...options,
        filter: { agentId },
      });

      if (documents.length > 0) {
        return documents
          .map(d => d.content)
          .join('\n\n---\n\n');
      }
    }

    // Fallback to local keyword search
    const knowledge = this.knowledge.get(agentId) || [];
    const queryWords = query.toLowerCase().split(/\s+/);

    const matches = knowledge
      .map(entry => {
        const contentLower = entry.content.toLowerCase();
        const matchCount = queryWords.filter(w => contentLower.includes(w)).length;
        return { entry, score: matchCount / queryWords.length };
      })
      .filter(m => m.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, options?.topK || 5);

    return matches
      .map(m => `[${m.entry.type}] ${m.entry.content}`)
      .join('\n\n---\n\n');
  }

  /**
   * Export all learned knowledge for an agent
   */
  async exportKnowledge(agentId: string): Promise<RAGDocument[]> {
    const knowledge = this.knowledge.get(agentId) || [];
    
    return knowledge.map(entry => ({
      id: entry.id,
      content: entry.content,
      metadata: {
        type: entry.type,
        learnedAt: entry.learnedAt.toISOString(),
        ...entry.metadata,
      },
    }));
  }

  /**
   * Import knowledge for an agent
   */
  async importKnowledge(agentId: string, documents: RAGDocument[]): Promise<void> {
    const entries: KnowledgeEntry[] = documents.map(doc => ({
      id: doc.id,
      agentId,
      type: (doc.metadata?.type as KnowledgeEntry['type']) || 'insight',
      content: doc.content,
      metadata: doc.metadata || {},
      learnedAt: doc.metadata?.learnedAt 
        ? new Date(doc.metadata.learnedAt as string) 
        : new Date(),
    }));

    const existing = this.knowledge.get(agentId) || [];
    this.knowledge.set(agentId, [...existing, ...entries]);

    // Also add to RAG if available
    if (this.ragService && this.config.storeEmbeddings) {
      const ragDocs = documents.map(d => ({
        ...d,
        metadata: { ...d.metadata, agentId },
      }));
      await this.ragService.addDocuments(ragDocs);
    }

    this.logger.log(`Imported ${documents.length} knowledge entries for agent ${agentId}`);
  }

  /**
   * Get learning statistics for an agent
   */
  async getStats(agentId: string): Promise<{
    documentCount: number;
    conversationCount: number;
    lastLearnedAt?: Date;
  }> {
    const stats = this.stats.get(agentId);
    
    if (!stats) {
      return {
        documentCount: 0,
        conversationCount: 0,
      };
    }

    return {
      documentCount: stats.documentCount,
      conversationCount: stats.conversationCount,
      lastLearnedAt: stats.lastLearnedAt,
    };
  }

  /**
   * Clear all learned knowledge for an agent
   */
  async clearKnowledge(agentId: string): Promise<void> {
    const knowledge = this.knowledge.get(agentId) || [];
    
    // Remove from RAG
    if (this.ragService) {
      await this.ragService.deleteDocuments(knowledge.map(k => k.id));
    }

    this.knowledge.delete(agentId);
    this.stats.delete(agentId);

    this.logger.log(`Cleared all knowledge for agent ${agentId}`);
  }

  /**
   * Learn user preferences from a message
   */
  async learnPreference(
    agentId: string,
    preference: string,
    category?: string
  ): Promise<void> {
    const entry: KnowledgeEntry = {
      id: uuidv4(),
      agentId,
      type: 'preference',
      content: preference,
      metadata: { category },
      learnedAt: new Date(),
    };

    const existing = this.knowledge.get(agentId) || [];
    existing.push(entry);
    this.knowledge.set(agentId, existing);

    if (this.ragService && this.config.storeEmbeddings) {
      await this.ragService.addDocuments([{
        id: entry.id,
        content: preference,
        metadata: { agentId, type: 'preference', category },
      }]);
    }

    this.logger.log(`Learned preference for agent ${agentId}: ${preference.slice(0, 50)}...`);
  }
}

