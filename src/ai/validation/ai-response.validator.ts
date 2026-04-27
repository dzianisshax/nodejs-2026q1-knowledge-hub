import { Logger } from '@nestjs/common';

const logger = new Logger('AiResponseValidator');

export interface Schema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    enum?: unknown[];
    required?: boolean;
    items?: { type: string };
  };
}

export function validateShape<T>(raw: unknown, schema: Schema, fallback: T): T {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    logger.warn('AI response is not an object — using fallback');
    return fallback;
  }

  const obj = raw as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, rule] of Object.entries(schema)) {
    const value = obj[key];
    const missing = value === undefined || value === null;

    if (missing && rule.required !== false) {
      logger.warn(
        `AI response missing required field "${key}" — using fallback`,
      );
      return fallback;
    }

    if (!missing) {
      if (rule.type === 'array' && !Array.isArray(value)) {
        logger.warn(
          `AI response field "${key}" expected array, got ${typeof value} — coercing to []`,
        );
        result[key] = [];
        continue;
      }

      if (rule.type !== 'array' && typeof value !== rule.type) {
        logger.warn(
          `AI response field "${key}" expected ${rule.type}, got ${typeof value} — using fallback`,
        );
        return fallback;
      }

      if (rule.enum && !rule.enum.includes(value)) {
        logger.warn(
          `AI response field "${key}" value "${value}" not in enum ${JSON.stringify(rule.enum)} — using first enum value`,
        );
        result[key] = rule.enum[0];
        continue;
      }

      if (rule.type === 'array' && rule.items) {
        const arr = value as unknown[];
        result[key] = arr.filter((item) => {
          if (typeof item !== rule.items!.type) {
            logger.warn(
              `AI response array "${key}" contains invalid item type — item skipped`,
            );
            return false;
          }
          return true;
        });
        continue;
      }
    }

    result[key] = missing ? undefined : value;
  }

  return result as T;
}
