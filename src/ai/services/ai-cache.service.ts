import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

@Injectable()
export class AiCacheService {
  private readonly logger = new Logger(AiCacheService.name);
  private readonly store = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;

  private get ttlMs(): number {
    return parseInt(process.env.AI_CACHE_TTL_SEC ?? '300', 10) * 1000;
  }

  set(key: string, value: unknown): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    this.logger.debug(`Cache SET: ${key}`);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    this.logger.debug(`Cache HIT: ${key}`);
    return entry.value as T;
  }

  buildKey(parts: Record<string, unknown>): string {
    return Object.entries(parts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
  }

  stats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio:
        this.hits + this.misses === 0
          ? 0
          : Number((this.hits / (this.hits + this.misses)).toFixed(3)),
    };
  }
}
