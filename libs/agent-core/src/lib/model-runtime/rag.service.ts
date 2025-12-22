import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IRAGService,
  RAGDocument,
  RAGQueryOptions,
  IModelRuntime,
  MODEL_RUNTIME,
} from './model-runtime.types';

/**
 * Simple in-memory vector store for RAG
 * Can be replaced with Pinecone, Weaviate, ChromaDB etc.
 */
interface VectorEntry {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  createdAt: Date;
}

/**
 * RAG Service Implementation
 * 
 * Provides Retrieval-Augmented Generation capabilities:
 * - Document storage with embeddings
 * - Semantic similarity search
 * - Context retrieval for LLM prompts
 * 
 * Uses in-memory vector store by default, can be extended
 * for production vector databases.
 */
@Injectable()
export class RAGService implements IRAGService {
  private readonly logger = new Logger(RAGService.name);
  private readonly vectorStore: Map<string, VectorEntry> = new Map();
  private embeddingDimension = 384; // Default for many models
  private embeddingModel = 'nomic-embed-text';

  constructor(
    @Optional()
    @Inject(MODEL_RUNTIME)
    private readonly modelRuntime?: IModelRuntime,
  ) {
    this.logger.log('RAG Service initialized');
  }

  /**
   * Generate embeddings for text using the LLM
   */
  async embed(text: string): Promise<number[]> {
    if (!this.modelRuntime) {
      // Fallback to simple hash-based embedding for testing
      return this.simpleEmbed(text);
    }

    try {
      // Use Ollama embeddings API
      const response = await fetch(`${process.env['OLLAMA_URL'] || 'http://localhost:11434'}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.embeddingModel,
          prompt: text,
        }),
      });

      const data = await response.json() as { embedding?: number[] };
      if (data.embedding) {
        this.embeddingDimension = data.embedding.length;
        return data.embedding;
      }

      throw new Error('No embedding returned');
    } catch (error) {
      this.logger.warn(`Embedding failed, using fallback: ${(error as Error).message}`);
      return this.simpleEmbed(text);
    }
  }

  /**
   * Simple hash-based embedding fallback
   * NOT for production - just for testing without embedding model
   */
  private simpleEmbed(text: string): number[] {
    const embedding = new Array(this.embeddingDimension).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(j);
        hash = hash & hash;
      }
      const index = Math.abs(hash) % this.embeddingDimension;
      embedding[index] += 1 / (i + 1); // Weight by position
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(documents: RAGDocument[]): Promise<void> {
    this.logger.log(`Adding ${documents.length} documents to vector store`);

    for (const doc of documents) {
      const id = doc.id || uuidv4();
      
      // Generate embedding if not provided
      const embedding = doc.embedding || await this.embed(doc.content);

      const entry: VectorEntry = {
        id,
        content: doc.content,
        embedding,
        metadata: doc.metadata || {},
        createdAt: new Date(),
      };

      this.vectorStore.set(id, entry);
    }

    this.logger.log(`Vector store now contains ${this.vectorStore.size} documents`);
  }

  /**
   * Query similar documents using semantic search
   */
  async query(query: string, options: RAGQueryOptions = {}): Promise<RAGDocument[]> {
    const { topK = 5, minScore = 0.3, filter, includeMetadata = true } = options;

    if (this.vectorStore.size === 0) {
      return [];
    }

    // Generate query embedding
    const queryEmbedding = await this.embed(query);

    // Calculate similarity scores
    const scores: Array<{ entry: VectorEntry; score: number }> = [];
    
    for (const entry of this.vectorStore.values()) {
      // Apply metadata filter if provided
      if (filter) {
        let matches = true;
        for (const [key, value] of Object.entries(filter)) {
          if (entry.metadata[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }

      const score = this.cosineSimilarity(queryEmbedding, entry.embedding);
      if (score >= minScore) {
        scores.push({ entry, score });
      }
    }

    // Sort by score and take top K
    scores.sort((a, b) => b.score - a.score);
    const topResults = scores.slice(0, topK);

    // Convert to RAGDocument format
    return topResults.map(({ entry, score }) => ({
      id: entry.id,
      content: entry.content,
      metadata: includeMetadata ? entry.metadata : undefined,
      embedding: undefined, // Don't return embeddings by default
      score,
    }));
  }

  /**
   * Delete documents by ID
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    let deleted = 0;
    for (const id of ids) {
      if (this.vectorStore.delete(id)) {
        deleted++;
      }
    }
    this.logger.log(`Deleted ${deleted} documents from vector store`);
  }

  /**
   * Clear all documents
   */
  async clear(): Promise<void> {
    const count = this.vectorStore.size;
    this.vectorStore.clear();
    this.logger.log(`Cleared ${count} documents from vector store`);
  }

  /**
   * Get document count
   */
  async count(): Promise<number> {
    return this.vectorStore.size;
  }

  /**
   * Get all documents (for export)
   */
  async getAllDocuments(): Promise<RAGDocument[]> {
    return Array.from(this.vectorStore.values()).map(entry => ({
      id: entry.id,
      content: entry.content,
      metadata: entry.metadata,
      embedding: entry.embedding,
    }));
  }

  /**
   * Set embedding model
   */
  setEmbeddingModel(modelName: string): void {
    this.embeddingModel = modelName;
    this.logger.log(`Embedding model set to: ${modelName}`);
  }

  /**
   * Build context string from retrieved documents
   */
  buildContext(documents: RAGDocument[], maxTokens = 2000): string {
    let context = '';
    let estimatedTokens = 0;
    const tokensPerChar = 0.25; // Rough estimate

    for (const doc of documents) {
      const docText = `[Source: ${doc.id}]\n${doc.content}\n\n`;
      const docTokens = Math.ceil(docText.length * tokensPerChar);

      if (estimatedTokens + docTokens > maxTokens) {
        break;
      }

      context += docText;
      estimatedTokens += docTokens;
    }

    return context.trim();
  }
}

