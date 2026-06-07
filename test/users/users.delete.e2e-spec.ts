import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  bootstrapNestApp,
  getAuthToken,
} from '../helpers/bootstrap-nest-app.helper';
import request from 'supertest';
import { validUserPayload } from './users.post.e2e-spec.sample-data';
import { dropDatabase } from '../helpers/drop-database.helper';

describe('[Users] @Delete endpoints (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let httpServer: ReturnType<INestApplication['getHttpServer']>;
  let accessToken: string;
  let authUserId: number;

  describe('DELETE /v1/users/:id', () => {
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
        .delete(`/v1/users/${authUserId}`)
        .expect(401);
    });

    it('should delete a user and return 200 with a confirmation message', async () => {
      // Create a separate user to delete
      const newUserRes = await request(httpServer)
        .post('/v1/users')
        .send(validUserPayload())
        .expect(201);
      const newUserId = newUserRes.body.data.id;

      const response = await request(httpServer)
        .delete(`/v1/users/${newUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.message).toContain(String(newUserId));
    });

    it('should return 404 when user does not exist', async () => {
      await request(httpServer)
        .delete('/v1/users/9999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 400 for invalid user id format', async () => {
      await request(httpServer)
        .delete('/v1/users/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should confirm user is gone after deletion', async () => {
      const newUserRes = await request(httpServer)
        .post('/v1/users')
        .send(validUserPayload())
        .expect(201);
      const newUserId = newUserRes.body.data.id;

      await request(httpServer)
        .delete(`/v1/users/${newUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      await request(httpServer)
        .get(`/v1/users/${newUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
