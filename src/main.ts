import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createApp } from './app.create';

/**
 * Bootstraps the NestJS application with versioning, validation, and Swagger.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure global settings and Swagger documentation
  createApp(app);

  await app.listen(8000);
}

bootstrap();
