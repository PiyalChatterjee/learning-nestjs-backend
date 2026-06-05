import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Bootstraps the NestJS application with versioning, validation, and Swagger.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('v1', {
    exclude: [{ path: '', method: RequestMethod.GET }],
  });

  const config = new DocumentBuilder()
    .setTitle('NestJS Backend API')
    .setDescription('API documentation for the NestJS backend application')
    .addServer('http://localhost:8000', 'Local development server')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  //enable CORS for all origins (adjust as needed for production)
  app.enableCors();

  

  await app.listen(8000);
}

bootstrap();
