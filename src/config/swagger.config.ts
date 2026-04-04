import { DocumentBuilder } from '@nestjs/swagger';

export function getSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Knowledge Hub API')
    .setDescription('API documentation for Knowledge Hub')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
}
