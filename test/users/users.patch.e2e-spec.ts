import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  bootstrapNestApp,
  getAuthToken,
} from '../helpers/bootstrap-nest-app.helper';
import request from 'supertest';
import { validUserPayload } from './users.post.e2e-spec.sample-data';
import { dropDatabase } from '../helpers/drop-database.helper';

describe('[Users] @Patch Endpoints (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let httpServer: ReturnType<INestApplication['getHttpServer']>;
  let accessToken: string;
  let authUserId: number;

  describe('PATCH /v1/users/:id', () => {
    beforeEach(async () => {
      app = await bootstrapNestApp(app);
      dataSource = app.get<DataSource>(DataSource);
      httpServer = app.getHttpServer();
      const auth = await getAuthToken(httpServer);
      accessToken = auth.accessToken;
      authUserId = auth.createdUserId;
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
      await request(httpServer)
        .patch(`/v1/users/${authUserId}`)
        .send({ firstName: 'NewName' })
        .expect(401);
    });

    it('should partially update firstName and return 200', async () => {
      const response = await request(httpServer)
        .patch(`/v1/users/${authUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ firstName: 'UpdatedFirst' })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toContain('UpdatedFirst');
    });

    it('should partially update email and return 200', async () => {
      const newEmail = validUserPayload().email;

      const response = await request(httpServer)
        .patch(`/v1/users/${authUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: newEmail })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(newEmail);
    });

    it('should return 409 when patching to an email already in use', async () => {
      const secondPayload = validUserPayload();
      await request(httpServer).post('/v1/users').send(secondPayload).expect(201);

      await request(httpServer)
        .patch(`/v1/users/${authUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: secondPayload.email })
        .expect(409);
    });

    it('should return 404 when user does not exist', async () => {
      await request(httpServer)
        .patch('/v1/users/9999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ firstName: 'Ghost' })
        .expect(404);
    });

    it('should return 400 for invalid user id format', async () => {
      await request(httpServer)
        .patch('/v1/users/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ firstName: 'Test' })
        .expect(400);
    });

    it('should not modify unspecified fields', async () => {
      // Get the current state of the user
      const beforeRes = await request(httpServer)
        .get(`/v1/users/${authUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const originalEmail = beforeRes.body.data.email;

      // Patch only firstName
      await request(httpServer)
        .patch(`/v1/users/${authUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ firstName: 'OnlyFirst' })
        .expect(200);

      // Email should be unchanged
      const afterRes = await request(httpServer)
        .get(`/v1/users/${authUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(afterRes.body.data.email).toBe(originalEmail);
    });
  });
});
