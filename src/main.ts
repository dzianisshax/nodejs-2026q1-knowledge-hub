import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from '././utils/swagger.utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties with no decorators
      forbidNonWhitelisted: true, // 400 if unknown properties are sent
      transform: true, // auto-transform payloads to DTO instances
    }),
  );

  setupSwagger(app);

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
