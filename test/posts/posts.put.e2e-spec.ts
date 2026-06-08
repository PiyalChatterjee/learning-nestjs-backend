import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { bootstrapNestApp, getAuthToken } from '../helpers/bootstrap-nest-app.helper';
import { dropDatabase } from '../helpers/drop-database.helper';
import { validPostPayload } from './posts.post.e2e-spec.sample-data';

describe('PUT /v1/posts/:id (e2e)', () => {
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

  describe('PUT /v1/posts/:id', () => {
    it('should fully replace a post with valid payload', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;
      const updatePayload = {
        title: 'Updated Title',
        postType: 'post',
        slug: 'updated-slug',
        status: 'published',
        publishOn: new Date().toISOString(),
        tags: [],
        content: 'Updated content',
      };

      const response = await request(httpServer)
        .put(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(200);

      expect(response.body.data.title).toBe(updatePayload.title);
      expect(response.body.data.slug).toBe(updatePayload.slug);
      expect(response.body.data.status).toBe(updatePayload.status);
    });

    it('should return 401 when no authorization token is provided', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;
      const updatePayload = validPostPayload();

      await request(httpServer)
        .put(`/v1/posts/${postId}`)
        .send(updatePayload)
        .expect(401);
    });

    it('should return 404 when post does not exist', async () => {
      const updatePayload = validPostPayload();

      await request(httpServer)
        .put('/v1/posts/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(404);
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

      // Attempt to update post 2 with post 1's slug
      const updatePayload = {
        title: 'New Title',
        postType: 'post',
        slug: payload1.slug, // Existing slug
        status: 'draft',
        publishOn: new Date().toISOString(),
        tags: [],
      };

      await request(httpServer)
        .put(`/v1/posts/${postId2}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(409);
    });

    it('should return 400 when required field is missing', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;
      const invalidPayload = {
        postType: 'post',
        slug: 'new-slug',
        status: 'draft',
        publishOn: new Date().toISOString(),
        tags: [],
        // missing title
      };

      await request(httpServer)
        .put(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidPayload)
        .expect(400);
    });

    it('should return 400 when post id is invalid format', async () => {
      const updatePayload = validPostPayload();

      await request(httpServer)
        .put('/v1/posts/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(400);
    });

    it('should persist updated post to database', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;
      const updatePayload = {
        title: 'Permanently Updated',
        postType: 'post',
        slug: 'permanently-updated',
        status: 'published',
        publishOn: new Date().toISOString(),
        tags: [],
      };

      await request(httpServer)
        .put(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatePayload)
        .expect(200);

      const getResponse = await request(httpServer)
        .get(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.data.title).toBe(updatePayload.title);
      expect(getResponse.body.data.slug).toBe(updatePayload.slug);
    });
  });
});
