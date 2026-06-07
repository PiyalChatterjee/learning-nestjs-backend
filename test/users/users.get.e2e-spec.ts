import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { bootstrapNestApp, getAuthToken } from '../helpers/bootstrap-nest-app.helper';
import { User } from '../../src/modules/users/user.entity';
import { dropDatabase } from '../helpers/drop-database.helper';
import request from 'supertest';
import { validUserPayload } from './users.post.e2e-spec.sample-data';


describe('[Users] @Get Endpoints (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let httpServer: ReturnType<INestApplication['getHttpServer']>;
  let accessToken: string;

  describe('GET /v1/users', () => {
    beforeEach(async () => {
      app = await bootstrapNestApp(app);
      dataSource = app.get<DataSource>(DataSource);
      httpServer = app.getHttpServer();
      ({ accessToken } = await getAuthToken(httpServer));
    });

    afterEach(async () => {
      if (dataSource && dataSource.isInitialized) {
        await dropDatabase(dataSource);
      }
      if (app) {
        await app.close();
      }
    });

    // Note: beforeEach calls getAuthToken which creates 1 user (the auth user).
    // So at test time, at least 1 user always exists.

    it('should return only the auth user when no extra users are added', async () => {
      const response = await request(httpServer)
        .get('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data.length).toBe(1);
    });

    it('should return all users with default pagination', async () => {
      const userRepository = dataSource.getRepository(User);
      const newUser = userRepository.create(validUserPayload());
      await userRepository.save(newUser);

      const response = await request(httpServer)
        .get('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
      // 1 auth user + 1 inserted user = 2
      expect(response.body.data.data.length).toBe(2);
    });

    it('should respect limit query parameter', async () => {
      const userRepository = dataSource.getRepository(User);
      for (let i = 0; i < 3; i++) {
        const newUser = userRepository.create(validUserPayload());
        await userRepository.save(newUser);
      }

      const response = await request(httpServer)
        .get('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ limit: 2 })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data.length).toBeLessThanOrEqual(2);
    });

    it('should respect page query parameter', async () => {
      const userRepository = dataSource.getRepository(User);
      for (let i = 0; i < 3; i++) {
        const newUser = userRepository.create(validUserPayload());
        await userRepository.save(newUser);
      }

      const response = await request(httpServer)
        .get('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ limit: 2, page: 1 })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('should return 400 for invalid limit', async () => {
      await request(httpServer)
        .get('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ limit: 'invalid' })
        .expect(400);
    });

    it('should return 400 for invalid page', async () => {
      await request(httpServer)
        .get('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 'invalid' })
        .expect(400);
    });

    it('should return 401 when no token is provided', async () => {
      await request(httpServer).get('/v1/users').expect(401);
    });
  });

  describe('GET /v1/users/:id', () => {
    let testUser: User;

    beforeEach(async () => {
      app = await bootstrapNestApp(app);
      dataSource = app.get<DataSource>(DataSource);
      httpServer = app.getHttpServer();
      ({ accessToken } = await getAuthToken(httpServer));

      const userRepository = dataSource.getRepository(User);
      testUser = userRepository.create(validUserPayload());
      await userRepository.save(testUser);
    });

    afterEach(async () => {
      if (dataSource && dataSource.isInitialized) {
        await dropDatabase(dataSource);
      }
      if (app) {
        await app.close();
      }
    });

    it('should return 401 when no token is provided', async () => {
      await request(httpServer).get(`/v1/users/${testUser.id}`).expect(401);
    });

    it('should return 404 when user does not exist', async () => {
      await request(httpServer)
        .get('/v1/users/9999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return user by id', async () => {
      const response = await request(httpServer)
        .get(`/v1/users/${testUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(testUser.email);
    });

    it('should return 400 for invalid user id format', async () => {
      await request(httpServer)
        .get('/v1/users/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should not expose password field in response', async () => {
      const response = await request(httpServer)
        .get(`/v1/users/${testUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.password).toBeUndefined();
    });
  });
});
