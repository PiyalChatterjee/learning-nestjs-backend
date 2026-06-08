import { INestApplication } from '@nestjs/common';
import { createApp } from '../../src/app.create';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/modules/mail/providers/mail.service';
import request from 'supertest';
import { validUserPayload } from '../users/users.post.e2e-spec.sample-data';
import { DataSource } from 'typeorm';

export async function bootstrapNestApp(
  app: INestApplication,
): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(MailService)
    .useValue({
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    })
    .compile();

  app = moduleFixture.createNestApplication();
  createApp(app); // Apply global settings and Swagger configuration
  await app.init();

  // Wait for database to be initialized (DatabaseConnectionBootstrap)
  const dataSource = app.get<DataSource>(DataSource);
  let retries = 0;
  const maxRetries = 30; // 30 * 100ms = 3 seconds
  while (!dataSource.isInitialized && retries < maxRetries) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    retries++;
  }

  if (!dataSource.isInitialized) {
    await app.close();
    throw new Error('Database failed to initialize within timeout period');
  }

  return app;
}

/**
 * Signs up a user and signs in to return a valid JWT access token,
 * the created user's payload, and the created user's database ID.
 * Used to authenticate protected endpoints in tests.
 */
export async function getAuthToken(httpServer: ReturnType<INestApplication['getHttpServer']>): Promise<{ accessToken: string; userPayload: ReturnType<typeof validUserPayload>; createdUserId: number }> {
  const userPayload = validUserPayload();
  const createRes = await request(httpServer).post('/v1/users').send(userPayload).expect(201);
  const createdUserId: number = createRes.body.data?.id;
  const signInRes = await request(httpServer)
    .post('/v1/auth/sign-in')
    .send({ email: userPayload.email, password: userPayload.password })
    .expect(200);
  const accessToken = signInRes.body.data?.accessToken ?? signInRes.body.accessToken;
  return { accessToken, userPayload, createdUserId };
}