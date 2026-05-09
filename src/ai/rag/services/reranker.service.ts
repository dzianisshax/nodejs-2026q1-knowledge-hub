import { Injectable, Logger } from '@nestjs/common';
import { SearchHit } from './qdrant.service';

interface RankedHit extends SearchHit {
  rerankScore: number;
  finalScore: number;
}

@Injectable()
export class RerankerService {
  private readonly logger = new Logger(RerankerService.name);

  // Reciprocal Rank Fusion — merges two ranked lists without needing score normalisation
  // Formula: RRF(d) = Σ 1 / (k + rank(d))  where k=60 is a smoothing constant
  fusionMerge(
    semanticHits: SearchHit[],
    lexicalHits: SearchHit[],
    k = 60,
  ): SearchHit[] {
    const scores = new Map<string, { hit: SearchHit; score: number }>();

    const addList = (hits: SearchHit[]) => {
      hits.forEach((hit, rank) => {
        const key = `${hit.articleId}:${hit.chunkIndex}`;
        const rrf = 1 / (k + rank + 1);
        const existing = scores.get(key);
        if (existing) {
          existing.score += rrf;
        } else {
          scores.set(key, { hit, score: rrf });
        }
      });
    };

    addList(semanticHits);
    addList(lexicalHits);

    return [...scores.values()]
      .sort((a, b) => b.score - a.score)
      .map(({ hit, score }) => ({ ...hit, similarity: score }));
  }

  // Secondary re-ranking — scores each chunk by positional relevance signals
  // without an extra Gemini call (zero latency overhead)
  rerank(query: string, hits: SearchHit[], topN: number): RankedHit[] {
    const queryTerms = new Set(
      query
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 2),
    );

    const ranked: RankedHit[] = hits.map((hit) => {
      const rerankScore = this.scoreChunk(queryTerms, hit);
      // Weighted combination: 70% original similarity + 30% rerank signal
      const finalScore = 0.7 * hit.similarity + 0.3 * rerankScore;
      return { ...hit, rerankScore, finalScore };
    });

    return ranked.sort((a, b) => b.finalScore - a.finalScore).slice(0, topN);
  }

  private scoreChunk(queryTerms: Set<string>, hit: SearchHit): number {
    const text = hit.chunk.toLowerCase();
    const words = text.split(/\s+/);
    const total = words.length || 1;

    // Term coverage — what fraction of query terms appear in the chunk
    const termCoverage =
      [...queryTerms].filter((t) => text.includes(t)).length /
      (queryTerms.size || 1);

    // Density — query terms appearing in the first 25% of the chunk score higher
    const earlyWords = new Set(words.slice(0, Math.ceil(total * 0.25)));
    const earlyDensity =
      [...queryTerms].filter((t) => earlyWords.has(t)).length /
      (queryTerms.size || 1);

    // Title match bonus — chunk whose article title contains query terms ranks higher
    const titleText = hit.articleTitle.toLowerCase();
    const titleMatch =
      [...queryTerms].filter((t) => titleText.includes(t)).length /
      (queryTerms.size || 1);

    // Prefer shorter chunks (more focused answers) — normalised against 800 char default
    const brevityBonus = Math.max(0, 1 - hit.chunk.length / 800);

    return (
      termCoverage * 0.4 +
      earlyDensity * 0.25 +
      titleMatch * 0.25 +
      brevityBonus * 0.1
    );
  }

  logRankingDecision(original: SearchHit[], reranked: RankedHit[]): void {
    const moved = reranked
      .map((hit, newRank) => {
        const oldRank = original.findIndex(
          (h) =>
            h.articleId === hit.articleId && h.chunkIndex === hit.chunkIndex,
        );
        return {
          chunk: hit.chunk.slice(0, 60),
          oldRank,
          newRank,
          delta: oldRank - newRank,
        };
      })
      .filter((r) => r.delta !== 0);

    if (moved.length > 0) {
      this.logger.debug(
        `Re-ranking moved ${moved.length} chunk(s): ${JSON.stringify(moved)}`,
      );
    }
  }
}
