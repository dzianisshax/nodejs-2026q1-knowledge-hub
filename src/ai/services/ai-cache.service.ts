import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

@Injectable()
export class AiCacheService {
  private readonly logger = new Logger(AiCacheService.name);
  private readonly store = new Map<string, CacheEntry>();
  private totalHits = 0;
  private totalMisses = 0;
  private totalEvictions = 0;

  private get ttlMs(): number {
    return parseInt(process.env.AI_CACHE_TTL_SEC ?? '300', 10) * 1000;
  }

  set(key: string, value: unknown): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
      createdAt: Date.now(),
      hits: 0,
    });
    this.logger.debug(`Cache SET: ${key}`);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      this.totalMisses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.totalMisses++;
      this.totalEvictions++;
      this.logger.debug(`Cache EXPIRED: ${key}`);
      return null;
    }

    entry.hits++;
    this.totalHits++;
    this.logger.debug(`Cache HIT: ${key} (entry hits: ${entry.hits})`);
    return entry.value as T;
  }

  buildKey(parts: Record<string, unknown>): string {
    return Object.entries(parts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
  }

  private topEntries(n = 5) {
    return [...this.store.entries()]
      .sort(([, a], [, b]) => b.hits - a.hits)
      .slice(0, n)
      .map(([key, entry]) => ({
        key,
        hits: entry.hits,
        ageSeconds: Math.floor((Date.now() - entry.createdAt) / 1000),
        expiresInSeconds: Math.max(
          0,
          Math.floor((entry.expiresAt - Date.now()) / 1000),
        ),
      }));
  }

  stats() {
    const total = this.totalHits + this.totalMisses;
    return {
      size: this.store.size,
      ttlSeconds: this.ttlMs / 1000,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      totalEvictions: this.totalEvictions,
      hitRatio: total === 0 ? 0 : Number((this.totalHits / total).toFixed(3)),
      topEntries: this.topEntries(),
    };
  }
}
