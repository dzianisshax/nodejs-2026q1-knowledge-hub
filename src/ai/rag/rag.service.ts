import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { QdrantService, hashContent } from './services/qdrant.service';
import { EmbeddingService } from './services/embedding.service';
import { ChunkerService } from './services/chunker.service';
import { RagConversationService } from './services/rag-conversation.service';
import { RerankerService } from './services/reranker.service';
import { GeminiService } from '../services/gemini.service';
import { ArticleService } from '../../article/article.service';
import { RAG_PROMPTS } from './prompts/rag.prompts';
import { ReindexDto } from './dto/reindex.dto';
import { RagSearchDto } from './dto/rag-search.dto';
import { RagChatDto } from './dto/rag-chat.dto';
import { ArticleStatus, Article } from '../../article/entities/article.entity';

const RAG_PAGE_SIZE = 1000;

interface IndexArticleResult {
  added: number;
  skipped: number;
  deleted: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly qdrant: QdrantService,
    private readonly embedding: EmbeddingService,
    private readonly chunker: ChunkerService,
    private readonly conversation: RagConversationService,
    private readonly reranker: RerankerService,
    private readonly gemini: GeminiService,
    private readonly articleService: ArticleService,
  ) {}

  // Incremental indexing

  private async indexArticleIncremental(
    article: Article,
  ): Promise<IndexArticleResult> {
    const fullText = `${article.title}\n\n${article.content}`;
    const chunks = this.chunker.chunk(fullText);

    if (chunks.length === 0) {
      this.logger.warn(
        `Article "${article.title}" produced 0 chunks — skipping`,
      );
      return { added: 0, skipped: 0, deleted: 0 };
    }

    // Fetch hashes already stored in Qdrant for this article
    const existingHashes = await this.qdrant.getExistingHashes(article.id);

    const toEmbed: Array<{ chunk: (typeof chunks)[number]; hash: string }> = [];
    let skipped = 0;

    for (const chunk of chunks) {
      const hash = hashContent(chunk.text);
      const storedHash = existingHashes.get(chunk.index);

      if (storedHash === hash) {
        // Chunk text is identical to what is already indexed — skip embedding
        skipped++;
      } else {
        toEmbed.push({ chunk, hash });
      }
    }

    if (toEmbed.length > 0) {
      const vectors = await this.embedding.embedBatch(
        toEmbed.map((c) => c.chunk.text),
      );

      const points = toEmbed.map(({ chunk, hash }, i) => ({
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
          contentHash: hash,
        },
      }));

      await this.qdrant.upsertVectors(points);
    }

    // Remove chunks that no longer exist (article was shortened)
    const validIndexes = chunks.map((c) => c.index);
    const deleted = await this.qdrant.deleteStaleChunks(
      article.id,
      validIndexes,
    );

    this.logger.log(
      `Article "${article.title}" (${article.id}): +${toEmbed.length} indexed, =${skipped} skipped, -${deleted} deleted`,
    );

    return { added: toEmbed.length, skipped, deleted };
  }

  private async fetchArticles(dto: ReindexDto): Promise<Article[]> {
    const filters =
      dto.onlyPublished !== false ? { status: ArticleStatus.PUBLISHED } : {};

    const paginated = await this.articleService.findAll(
      filters,
      1,
      RAG_PAGE_SIZE,
    );
    let articles = paginated.data;

    if (dto.articleIds?.length) {
      const idSet = new Set(dto.articleIds);
      articles = articles.filter((a) => idSet.has(a.id));
    }

    return articles;
  }

  // Hybrid retrieval

  private async hybridSearch(
    query: string,
    limit: number,
    filter?: { articleStatus?: string; categoryId?: string; tags?: string[] },
  ) {
    const fetchLimit = limit * 3; // over-fetch so fusion has enough candidates

    let queryVector: number[];
    try {
      queryVector = await this.embedding.embed(query);
    } catch (err) {
      this.logger.error(`Embedding failed: ${String(err)}`);
      throw new ServiceUnavailableException(
        'Embedding service temporarily unavailable',
      );
    }

    // Run semantic and lexical in parallel
    const [semanticHits, lexicalHits] = await Promise.all([
      this.qdrant.search(queryVector, fetchLimit, filter),
      this.qdrant.lexicalSearch(query, fetchLimit, filter),
    ]);

    this.logger.debug(
      `Hybrid retrieval: semantic=${semanticHits.length} lexical=${lexicalHits.length}`,
    );

    // Merge with Reciprocal Rank Fusion
    const fused = this.reranker.fusionMerge(semanticHits, lexicalHits);

    // Secondary re-ranking on the fused candidates
    const reranked = this.reranker.rerank(query, fused, limit);
    this.reranker.logRankingDecision(fused, reranked);

    return reranked;
  }

  // Public endpoints

  async reindex(dto: ReindexDto) {
    await this.qdrant.ensureCollection();

    const articles = await this.fetchArticles(dto);

    let totalAdded = 0;
    let totalSkipped = 0;
    let totalDeleted = 0;
    let totalChunks = 0;

    for (const article of articles) {
      try {
        const result = await this.indexArticleIncremental(article);
        totalAdded += result.added;
        totalSkipped += result.skipped;
        totalDeleted += result.deleted;
        totalChunks += result.added + result.skipped;
      } catch (err) {
        // Log and continue — one failing article should not abort full reindex
        this.logger.error(
          `Failed to index article ${article.id}: ${String(err)}`,
        );
      }
    }

    this.logger.log(
      `Reindex complete: ${articles.length} articles | +${totalAdded} added | =${totalSkipped} skipped | -${totalDeleted} deleted`,
    );

    return {
      indexedArticles: articles.length,
      indexedChunks: totalChunks,
      addedChunks: totalAdded,
      skippedChunks: totalSkipped,
      deletedChunks: totalDeleted,
      vectorCollection:
        process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles',
    };
  }

  async search(dto: RagSearchDto) {
    await this.qdrant.ensureCollection();

    const results = await this.hybridSearch(dto.query, dto.limit ?? 5, {
      articleStatus: dto.articleStatus,
      categoryId: dto.categoryId,
      tags: dto.tags,
    });

    return {
      results: results.map((r) => ({
        articleId: r.articleId,
        articleTitle: r.articleTitle,
        chunk: r.chunk,
        similarity: r.similarity,
      })),
    };
  }

  async chat(dto: RagChatDto) {
    await this.qdrant.ensureCollection();

    const conversationId = dto.conversationId ?? uuidv4();
    const history = this.conversation.getHistory(conversationId);

    const hits = await this.hybridSearch(dto.question, 5);

    if (hits.length === 0) {
      const answer =
        "I don't have enough information in the knowledge base to answer that.";
      this.conversation.append(conversationId, 'user', dto.question);
      this.conversation.append(conversationId, 'assistant', answer);
      return { answer, sources: [], conversationId };
    }

    const prompt = RAG_PROMPTS.chat(dto.question, hits, history);

    let geminiResult: { text: string; tokens: number; latencyMs: number };
    try {
      geminiResult = await this.gemini.generate(prompt);
    } catch (err) {
      this.logger.error(`Gemini generation failed in RAG chat: ${String(err)}`);
      throw new ServiceUnavailableException(
        'AI generation service temporarily unavailable',
      );
    }

    const answer = geminiResult.text.trim();

    this.conversation.append(conversationId, 'user', dto.question);
    this.conversation.append(conversationId, 'assistant', answer);

    this.logger.log(
      `RAG chat: conversationId=${conversationId} hits=${hits.length} latency=${geminiResult.latencyMs}ms`,
    );

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
      throw new NotFoundException(
        `No index entries found for articleId=${articleId}`,
      );
    }
    this.logger.log(`Removed ${deleted} vector(s) for articleId=${articleId}`);
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

  getConversationStats() {
    return this.conversation.stats();
  }
}
