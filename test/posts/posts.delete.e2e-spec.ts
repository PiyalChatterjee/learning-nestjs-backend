import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { bootstrapNestApp, getAuthToken } from '../helpers/bootstrap-nest-app.helper';
import { dropDatabase } from '../helpers/drop-database.helper';
import { validPostPayload } from './posts.post.e2e-spec.sample-data';

describe('DELETE /v1/posts/:id (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let httpServer: ReturnType<INestApplication['getHttpServer']>;
  let accessToken: string;

  beforeEach(async () => {
    app = await bootstrapNestApp(app);
    dataSource = app.get<DataSource>(DataSource);
    httpServer = app.getHttpServer();
    const auth = await getAuthToken(httpServer);
    accessToken = auth.accessToken;
  });

  afterEach(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dropDatabase(dataSource);
    }
    if (app) {
      await app.close();
    }
  });

  describe('DELETE /v1/posts/:id', () => {
    it('should delete a post and return 200 with success message', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;

      const response = await request(httpServer)
        .delete(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.message).toBeDefined();
      expect(response.body.data.message).toContain('successfully');
    });

    it('should return 401 when no authorization token is provided', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;

      await request(httpServer)
        .delete(`/v1/posts/${postId}`)
        .expect(401);
    });

    it('should return 404 when post does not exist', async () => {
      await request(httpServer)
        .delete('/v1/posts/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 400 when post id is invalid format', async () => {
      await request(httpServer)
        .delete('/v1/posts/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should persist deletion to database', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;

      await request(httpServer)
        .delete(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify post is deleted by attempting to fetch it
      await request(httpServer)
        .get(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
