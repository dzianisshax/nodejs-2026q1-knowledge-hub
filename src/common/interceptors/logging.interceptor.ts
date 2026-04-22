import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

const SENSITIVE_KEYS = new Set([
  'password',
  'accessToken',
  'refreshToken',
  'token',
]);

function sanitize(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      SENSITIVE_KEYS.has(key) ? '[REDACTED]' : value,
    ]),
  );
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const { method, url, query, body } = req;
    const startTime = Date.now();

    this.logger.log(
      `Incoming request: ${method} ${url} | query: ${JSON.stringify(query)} | body: ${JSON.stringify(sanitize(body ?? {}))}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - startTime;
          this.logger.log(
            `Outgoing response: ${method} ${url} | status: ${res.statusCode} | ${ms}ms`,
          );
        },
        error: () => {
          const ms = Date.now() - startTime;
          this.logger.log(
            `Outgoing response: ${method} ${url} | status: ${res.statusCode} | ${ms}ms`,
          );
        },
      }),
    );
  }
}
