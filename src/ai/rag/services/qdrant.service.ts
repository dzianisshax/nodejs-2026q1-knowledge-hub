import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import * as crypto from 'crypto';

export interface VectorMetadata {
  articleId: string;
  articleTitle: string;
  chunkIndex: number;
  chunkText: string;
  status: string;
  categoryId: string | null;
  tags: string[];
  contentHash: string; // sha256 of chunk text — used for incremental indexing
}

export interface SearchHit {
  articleId: string;
  articleTitle: string;
  chunk: string;
  similarity: number;
  chunkIndex: number;
}

interface QdrantFilter {
  must?: object[];
}

export function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

@Injectable()
export class QdrantService {
  private readonly logger = new Logger(QdrantService.name);
  private readonly client: QdrantClient;
  private readonly vectorSize = 768;

  constructor() {
    this.client = new QdrantClient({
      url: process.env.RAG_VECTOR_DB_URL ?? 'http://localhost:6333',
    });
  }

  private get collection(): string {
    return process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles';
  }

  async ensureCollection(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collection,
      );

      if (!exists) {
        await this.client.createCollection(this.collection, {
          vectors: { size: this.vectorSize, distance: 'Cosine' },
        });
        this.logger.log(`Created Qdrant collection: ${this.collection}`);
      }
    } catch (err) {
      this.logger.error(`Qdrant ensureCollection failed: ${String(err)}`);
      throw new ServiceUnavailableException(
        'Vector DB is unavailable — cannot ensure collection',
      );
    }
  }

  async upsertVectors(
    points: Array<{ id: string; vector: number[]; payload: VectorMetadata }>,
  ): Promise<void> {
    try {
      await this.client.upsert(this.collection, {
        wait: true,
        points: points.map((p) => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload as unknown as Record<string, unknown>,
        })),
      });
    } catch (err) {
      this.logger.error(`Qdrant upsert failed: ${String(err)}`);
      throw new ServiceUnavailableException(
        'Vector DB is unavailable — upsert failed',
      );
    }
  }

  async deleteByArticleId(articleId: string): Promise<number> {
    try {
      const existing = await this.client.scroll(this.collection, {
        filter: { must: [{ key: 'articleId', match: { value: articleId } }] },
        limit: 10000,
        with_payload: false,
        with_vector: false,
      });

      const count = existing.points.length;
      if (count === 0) return 0;

      await this.client.delete(this.collection, {
        wait: true,
        filter: { must: [{ key: 'articleId', match: { value: articleId } }] },
      });

      this.logger.log(`Deleted ${count} vector(s) for articleId=${articleId}`);
      return count;
    } catch (err) {
      this.logger.error(`Qdrant deleteByArticleId failed: ${String(err)}`);
      throw new ServiceUnavailableException(
        'Vector DB is unavailable — delete failed',
      );
    }
  }

  // Returns existing content hashes per chunkIndex for an article
  // Used for incremental indexing — if hash matches, chunk is skipped
  async getExistingHashes(articleId: string): Promise<Map<number, string>> {
    try {
      const result = await this.client.scroll(this.collection, {
        filter: { must: [{ key: 'articleId', match: { value: articleId } }] },
        limit: 10000,
        with_payload: true,
        with_vector: false,
      });

      const map = new Map<number, string>();
      for (const point of result.points) {
        const payload = point.payload as unknown as VectorMetadata;
        if (payload?.chunkIndex !== undefined && payload?.contentHash) {
          map.set(payload.chunkIndex, payload.contentHash);
        }
      }
      return map;
    } catch (err) {
      this.logger.error(`Qdrant getExistingHashes failed: ${String(err)}`);
      throw new ServiceUnavailableException(
        'Vector DB is unavailable — hash fetch failed',
      );
    }
  }

  // Deletes only stale chunks (those whose chunkIndex no longer exists)
  async deleteStaleChunks(
    articleId: string,
    validChunkIndexes: number[],
  ): Promise<number> {
    try {
      const existing = await this.client.scroll(this.collection, {
        filter: { must: [{ key: 'articleId', match: { value: articleId } }] },
        limit: 10000,
        with_payload: true,
        with_vector: false,
      });

      const staleIds = existing.points
        .filter((p) => {
          const idx = (p.payload as unknown as VectorMetadata)?.chunkIndex;
          return !validChunkIndexes.includes(idx);
        })
        .map((p) => p.id as string);

      if (staleIds.length === 0) return 0;

      await this.client.delete(this.collection, {
        wait: true,
        points: staleIds,
      });

      this.logger.log(
        `Deleted ${staleIds.length} stale chunk(s) for articleId=${articleId}`,
      );
      return staleIds.length;
    } catch (err) {
      this.logger.error(`Qdrant deleteStaleChunks failed: ${String(err)}`);
      throw new ServiceUnavailableException(
        'Vector DB is unavailable — stale chunk cleanup failed',
      );
    }
  }

  async search(
    vector: number[],
    limit: number,
    filter?: {
      articleStatus?: string;
      categoryId?: string;
      tags?: string[];
    },
  ): Promise<SearchHit[]> {
    try {
      const must: object[] = [];

      if (filter?.articleStatus) {
        must.push({ key: 'status', match: { value: filter.articleStatus } });
      }
      if (filter?.categoryId) {
        must.push({ key: 'categoryId', match: { value: filter.categoryId } });
      }
      if (filter?.tags?.length) {
        must.push({ key: 'tags', match: { any: filter.tags } });
      }

      const qdrantFilter: QdrantFilter | undefined =
        must.length > 0 ? { must } : undefined;

      const results = await this.client.search(this.collection, {
        vector,
        limit,
        with_payload: true,
        ...(qdrantFilter ? { filter: qdrantFilter } : {}),
      });

      return results.map((r) => {
        const payload = r.payload as unknown as VectorMetadata;
        return {
          articleId: payload.articleId,
          articleTitle: payload.articleTitle,
          chunk: payload.chunkText,
          similarity: r.score,
          chunkIndex: payload.chunkIndex,
        };
      });
    } catch (err) {
      this.logger.error(`Qdrant search failed: ${String(err)}`);
      throw new ServiceUnavailableException(
        'Vector DB is unavailable — search failed',
      );
    }
  }

  // Lexical search — scrolls all chunks for an article set and scores by keyword overlap
  async lexicalSearch(
    query: string,
    limit: number,
    filter?: {
      articleStatus?: string;
      categoryId?: string;
      tags?: string[];
    },
  ): Promise<SearchHit[]> {
    try {
      const must: object[] = [];

      if (filter?.articleStatus) {
        must.push({ key: 'status', match: { value: filter.articleStatus } });
      }
      if (filter?.categoryId) {
        must.push({ key: 'categoryId', match: { value: filter.categoryId } });
      }
      if (filter?.tags?.length) {
        must.push({ key: 'tags', match: { any: filter.tags } });
      }

      const qdrantFilter: QdrantFilter | undefined =
        must.length > 0 ? { must } : undefined;

      // Scroll a window of candidates for BM25-like scoring
      const scrollResult = await this.client.scroll(this.collection, {
        ...(qdrantFilter ? { filter: qdrantFilter } : {}),
        limit: 500,
        with_payload: true,
        with_vector: false,
      });

      const queryTerms = this.tokenize(query);
      const scored = scrollResult.points
        .map((point) => {
          const payload = point.payload as unknown as VectorMetadata;
          const score = this.bm25Score(queryTerms, payload.chunkText);
          return { payload, score };
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return scored.map(({ payload, score }) => ({
        articleId: payload.articleId,
        articleTitle: payload.articleTitle,
        chunk: payload.chunkText,
        similarity: score,
        chunkIndex: payload.chunkIndex,
      }));
    } catch (err) {
      this.logger.error(`Qdrant lexicalSearch failed: ${String(err)}`);
      throw new ServiceUnavailableException(
        'Vector DB is unavailable — lexical search failed',
      );
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  // Simplified BM25 scoring (k1=1.5, b=0.75)
  private bm25Score(queryTerms: string[], docText: string): number {
    const k1 = 1.5;
    const b = 0.75;
    const avgDocLength = 400; // approximate average chunk length in tokens

    const docTerms = this.tokenize(docText);
    const docLength = docTerms.length;
    const termFreq = new Map<string, number>();

    for (const term of docTerms) {
      termFreq.set(term, (termFreq.get(term) ?? 0) + 1);
    }

    let score = 0;
    for (const term of new Set(queryTerms)) {
      const tf = termFreq.get(term) ?? 0;
      if (tf === 0) continue;
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));
      score += numerator / denominator;
    }

    return score;
  }
}
