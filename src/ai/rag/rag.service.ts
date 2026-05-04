import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { QdrantService } from './services/qdrant.service';
import { EmbeddingService } from './services/embedding.service';
import { ChunkerService } from './services/chunker.service';
import { RagConversationService } from './services/rag-conversation.service';
import { GeminiService } from '../services/gemini.service';
import { ArticleService } from '../../article/article.service';
import { RAG_PROMPTS } from './prompts/rag.prompts';
import { ReindexDto } from './dto/reindex.dto';
import { RagSearchDto } from './dto/rag-search.dto';
import { RagChatDto } from './dto/rag-chat.dto';
import { ArticleStatus } from '../../article/entities/article.entity';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly qdrant: QdrantService,
    private readonly embedding: EmbeddingService,
    private readonly chunker: ChunkerService,
    private readonly conversation: RagConversationService,
    private readonly gemini: GeminiService,
    private readonly articleService: ArticleService,
  ) {}

  async reindex(dto: ReindexDto) {
    await this.qdrant.ensureCollection();

    const filters: { status?: ArticleStatus } = {};
    if (dto.onlyPublished !== false) {
      filters.status = ArticleStatus.PUBLISHED;
    }

    let articles = await this.articleService.findAll(filters);

    if (dto.articleIds?.length) {
      articles = articles.filter((a) => dto.articleIds!.includes(a.id));
    }

    let totalChunks = 0;

    for (const article of articles) {
      // Remove existing vectors for this article before re-indexing
      await this.qdrant.deleteByArticleId(article.id);

      const fullText = `${article.title}\n\n${article.content}`;
      const chunks = this.chunker.chunk(fullText);

      const vectors = await this.embedding.embedBatch(chunks.map((c) => c.text));

      const points = chunks.map((chunk, i) => ({
        id: uuidv4(),
        vector: vectors[i],
        payload: {
          articleId: article.id,
          articleTitle: article.title,
          chunkIndex: chunk.index,
          chunkText: chunk.text,
          status: article.status,
          categoryId: article.categoryId ?? null,
          tags: article.tags ?? [],
        },
      }));

      await this.qdrant.upsertVectors(points);
      totalChunks += chunks.length;
      this.logger.log(`Indexed article "${article.title}" — ${chunks.length} chunks`);
    }

    return {
      indexedArticles: articles.length,
      indexedChunks: totalChunks,
      vectorCollection: process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles',
    };
  }

  async search(dto: RagSearchDto) {
    await this.qdrant.ensureCollection();

    const queryVector = await this.embedding.embed(dto.query);

    const results = await this.qdrant.search(queryVector, dto.limit ?? 5, {
      articleStatus: dto.articleStatus,
      categoryId: dto.categoryId,
      tags: dto.tags,
    });

    return { results };
  }

  async chat(dto: RagChatDto) {
    await this.qdrant.ensureCollection();

    const conversationId = dto.conversationId ?? uuidv4();
    const history = this.conversation.getHistory(conversationId);

    // Embed question and retrieve relevant chunks
    const queryVector = await this.embedding.embed(dto.question);
    const hits = await this.qdrant.search(queryVector, 5);

    if (hits.length === 0) {
      const answer = "I don't have enough information in the knowledge base to answer that.";
      this.conversation.append(conversationId, 'user', dto.question);
      this.conversation.append(conversationId, 'assistant', answer);
      return {
        answer,
        sources: [],
        conversationId,
      };
    }

    const prompt = RAG_PROMPTS.chat(dto.question, hits, history);

    let geminiResult: { text: string; tokens: number; latencyMs: number };
    try {
      geminiResult = await this.gemini.generate(prompt);
    } catch (err) {
      this.logger.error(`Gemini chat error: ${String(err)}`);
      throw new ServiceUnavailableException('AI service temporarily unavailable');
    }

    const answer = geminiResult.text.trim();

    this.conversation.append(conversationId, 'user', dto.question);
    this.conversation.append(conversationId, 'assistant', answer);

    return {
      answer,
      sources: hits.map((h) => ({
        articleId: h.articleId,
        articleTitle: h.articleTitle,
        relevantChunk: h.chunk,
      })),
      conversationId,
    };
  }

  async deleteArticleFromIndex(articleId: string): Promise<void> {
    const deleted = await this.qdrant.deleteByArticleId(articleId);
    if (deleted === 0) {
      throw new NotFoundException(`No index entries found for article ${articleId}`);
    }
  }

  getConversationHistory(conversationId: string) {
    if (!this.conversation.exists(conversationId)) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }
    return {
      conversationId,
      messages: this.conversation.getHistory(conversationId),
    };
  }
}