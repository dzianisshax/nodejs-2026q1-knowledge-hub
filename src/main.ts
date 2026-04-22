import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { setupSwagger } from '././utils/swagger.utils';
import { AppModule } from './app.module';
import { createAppLogger } from './logger/logger.factory';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const appLogger = createAppLogger();

  const app = await NestFactory.create(AppModule, {
    logger: appLogger,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties with no decorators
      forbidNonWhitelisted: true, // 400 if unknown properties are sent
      transform: true, // auto-transform payloads to DTO instances
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  setupSwagger(app);

  const port = process.env.PORT ?? 4000;
  const server = await app.listen(port);

  const processLogger = new Logger('Process');

  process.on('uncaughtException', async (error: Error) => {
    processLogger.error(`Uncaught exception: ${error.message}`, error.stack);
    try {
      server.close(() => processLogger.log('HTTP server closed'));
      await app.close();
      processLogger.log('Application closed gracefully');
    } catch (shutdownError) {
      processLogger.error('Error during graceful shutdown', shutdownError);
    } finally {
      process.exit(1);
    }
  });

  process.on('unhandledRejection', async (reason: unknown) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    processLogger.error(`Unhandled rejection: ${message}`, stack);
    try {
      server.close(() => processLogger.log('HTTP server closed'));
      await app.close();
      processLogger.log('Application closed gracefully');
    } catch (shutdownError) {
      processLogger.error('Error during graceful shutdown', shutdownError);
    } finally {
      process.exit(1);
    }
  });

  processLogger.log(`Application is running on port ${port}`);
}
bootstrap();
