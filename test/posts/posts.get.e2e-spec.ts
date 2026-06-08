import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { bootstrapNestApp, getAuthToken } from '../helpers/bootstrap-nest-app.helper';
import { dropDatabase } from '../helpers/drop-database.helper';
import { validPostPayload } from './posts.post.e2e-spec.sample-data';

describe('GET /v1/posts (e2e)', () => {
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

  describe('GET /v1/posts', () => {
    it('should list all posts', async () => {
      const payload = validPostPayload();
      await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const response = await request(httpServer)
        .get('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });

    it('should support pagination with page and limit query parameters', async () => {
      // Create 3 posts
      for (let i = 0; i < 3; i++) {
        const payload = validPostPayload();
        await request(httpServer)
          .post('/v1/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(payload)
          .expect(201);
      }

      const response = await request(httpServer)
        .get('/v1/posts?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.meta).toBeDefined();
      expect(response.body.data.meta.itemsPerPage).toBe(2);
    });

    it('should return empty list when no posts exist', async () => {
      const response = await request(httpServer)
        .get('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.data.length).toBe(0);
    });

    it('should return 401 when no authorization token is provided', async () => {
      await request(httpServer)
        .get('/v1/posts')
        .expect(401);
    });

    it('should respect limit parameter and cap at max limit', async () => {
      // Create 5 posts
      for (let i = 0; i < 5; i++) {
        const payload = validPostPayload();
        await request(httpServer)
          .post('/v1/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(payload)
          .expect(201);
      }

      const response = await request(httpServer)
        .get('/v1/posts?limit=3')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.data.length).toBeLessThanOrEqual(3);
    });

    it('should return metadata with pagination info', async () => {
      const payload = validPostPayload();
      await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const response = await request(httpServer)
        .get('/v1/posts?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.meta).toBeDefined();
      expect(response.body.data.meta.currentPage).toBe(1);
      expect(response.body.data.meta.itemsPerPage).toBe(10);
      expect(response.body.data.meta.totalItems).toBeGreaterThan(0);
    });
  });

  describe('GET /v1/posts/:id', () => {
    it('should retrieve a single post by id', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;

      const getResponse = await request(httpServer)
        .get(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.data.id).toBe(postId);
      expect(getResponse.body.data.title).toBe(payload.title);
    });

    it('should return 404 when post does not exist', async () => {
      await request(httpServer)
        .get('/v1/posts/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 400 when post id is invalid format', async () => {
      await request(httpServer)
        .get('/v1/posts/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should include author information in response', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;

      const getResponse = await request(httpServer)
        .get(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.data.author).toBeDefined();
      expect(getResponse.body.data.author).toHaveProperty('email');
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
        .get(`/v1/posts/${postId}`)
        .expect(401);
    });

    it('should return all post fields in response', async () => {
      const payload = validPostPayload();
      const createResponse = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const postId = createResponse.body.data.id;

      const getResponse = await request(httpServer)
        .get(`/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.data).toHaveProperty('id');
      expect(getResponse.body.data).toHaveProperty('title');
      expect(getResponse.body.data).toHaveProperty('slug');
      expect(getResponse.body.data).toHaveProperty('postType');
      expect(getResponse.body.data).toHaveProperty('status');
    });
  });
});
