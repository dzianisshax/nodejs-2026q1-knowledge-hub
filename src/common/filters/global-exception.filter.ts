import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../errors/app-errors';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responseBody = exception.getResponse();
      message =
        typeof responseBody === 'object' &&
        'message' in (responseBody as object)
          ? Array.isArray((responseBody as any).message)
            ? (responseBody as any).message.join(', ')
            : (responseBody as any).message
          : exception.message;
      error = exception.name;
    } else if (exception instanceof AppError) {
      statusCode = exception.statusCode;
      message = exception.message;
      error = exception.name;
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'Internal Server Error';
    }

    const isServerError = statusCode >= 500;

    if (isServerError) {
      this.logger.error(
        `${req.method} ${req.url} → ${statusCode} ${error}: ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${req.method} ${req.url} → ${statusCode} ${error}: ${message}`,
      );
    }

    res.status(statusCode).json({ statusCode, error, message });
  }
}
