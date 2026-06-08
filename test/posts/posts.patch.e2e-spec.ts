import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { bootstrapNestApp, getAuthToken } from '../helpers/bootstrap-nest-app.helper';
import { dropDatabase } from '../helpers/drop-database.helper';
import { validPostPayload } from './posts.post.e2e-spec.sample-data';

describe('PATCH /v1/posts/:id (e2e)', () => {
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

  describe('PATCH /v1/posts/:id', () => {
    it('should partially update a post title only', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;
      const originalSlug = createResponse.body.data.slug;

      const updatePayload = {
        title: 'Patched Title',
      };

      const response = await request(httpServer)
        .patch(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(200);

      expect(response.body.data.title).toBe(updatePayload.title);
      expect(response.body.data.slug).toBe(originalSlug);
    });

    it('should partially update post status only', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;
      const originalTitle = createResponse.body.data.title;

      const updatePayload = {
        status: 'published',
      };

      const response = await request(httpServer)
        .patch(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(200);

      expect(response.body.data.status).toBe(updatePayload.status);
      expect(response.body.data.title).toBe(originalTitle);
    });

    it('should verify field isolation - patching title does not change slug', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;
      const originalSlug = payload.slug;

      const patchPayload = {
        title: 'New Title Only',
      };

      const response = await request(httpServer)
        .patch(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(patchPayload)
        .expect(200);

      expect(response.body.data.title).toBe(patchPayload.title);
      expect(response.body.data.slug).toBe(originalSlug);
    });

    it('should partially update multiple fields at once', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;

      const updatePayload = {
        title: 'Patched Title',
        status: 'published',
        content: 'Patched content',
      };

      const response = await request(httpServer)
        .patch(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(200);

      expect(response.body.data.title).toBe(updatePayload.title);
      expect(response.body.data.status).toBe(updatePayload.status);
      expect(response.body.data.content).toBe(updatePayload.content);
    });

    it('should return 401 when no authorization token is provided', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;
      const updatePayload = { title: 'Updated' };

      await request(httpServer)
        .patch(`/v1/posts/${postId}`)
        .send(updatePayload)
        .expect(401);
    });

    it('should return 404 when post does not exist', async () => {
      const updatePayload = { title: 'Updated' };

      await request(httpServer)
        .patch('/v1/posts/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(404);
    });

    it('should return 400 when post id is invalid format', async () => {
      const updatePayload = { title: 'Updated' };

      await request(httpServer)
        .patch('/v1/posts/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(400);
    });

    it('should enforce slug uniqueness constraint with 409 conflict', async () => {
      const payload1 = validPostPayload();
      const payload2 = validPostPayload();

      const createResponse1 = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload1)
        .expect(201);

      const createResponse2 = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload2)
        .expect(201);

      const postId2 = createResponse2.body.data.id;

      const updatePayload = {
        slug: payload1.slug, // Existing slug
      };

      await request(httpServer)
        .patch(`/v1/posts/${postId2}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(409);
    });

    it('should persist patched post to database', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;

      const updatePayload = {
        title: 'Persisted Patch Title',
      };

      await request(httpServer)
        .patch(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(200);

      const getResponse = await request(httpServer)
        .get(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.data.title).toBe(updatePayload.title);
    });
  });
});
