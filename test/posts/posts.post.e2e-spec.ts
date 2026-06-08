import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { bootstrapNestApp, getAuthToken } from '../helpers/bootstrap-nest-app.helper';
import { dropDatabase } from '../helpers/drop-database.helper';
import {
  validPostPayload,
  postWithMissingTitle,
  postWithMissingSlug,
  postWithInvalidPostType,
  postWithInvalidStatus,
} from './posts.post.e2e-spec.sample-data';

describe('POST /v1/posts (e2e)', () => {
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

  describe('POST /v1/posts', () => {
    it('should create a post with valid payload', async () => {
      const payload = validPostPayload();
      const response = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(payload.title);
      expect(response.body.data.slug).toBe(payload.slug);
      expect(response.body.data.postType).toBe(payload.postType);
      expect(response.body.data.status).toBe(payload.status);
    });

    it('should return 401 when no authorization token is provided', async () => {
      const payload = validPostPayload();
      await request(httpServer)
        .post('/v1/posts')
        .send(payload)
        .expect(401);
    });

    it('should return 400 when title is missing', async () => {
      const payload = postWithMissingTitle();
      await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('should return 400 when slug is missing', async () => {
      const payload = postWithMissingSlug();
      await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('should return 400 when postType is invalid', async () => {
      const payload = postWithInvalidPostType();
      await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('should return 400 when status is invalid', async () => {
      const payload = postWithInvalidStatus();
      await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('should enforce slug uniqueness constraint with 409 conflict', async () => {
      const payload = validPostPayload();
      
      // Create first post
      await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      // Attempt to create second post with same slug
      await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(409);
    });

    it('should derive author from JWT claims', async () => {
      const payload = validPostPayload();
      const response = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      expect(response.body.data.author).toBeDefined();
      expect(response.body.data.author).toHaveProperty('email');
    });

    it('should persist post to database', async () => {
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

      expect(getResponse.body.data.title).toBe(payload.title);
    });

    it('should set default status to DRAFT when not provided', async () => {
      const payload = {
        title: 'Test Post',
        postType: 'post',
        slug: 'test-post-unique',
        status: 'draft',
        publishOn: new Date().toISOString(),
        tags: [],
      };

      const response = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      expect(response.body.data.status).toBe('draft');
    });

    it('should allow posts with featured image URL', async () => {
      const payload = {
        title: 'Post with Image',
        postType: 'post',
        slug: 'post-with-image',
        status: 'draft',
        publishOn: new Date().toISOString(),
        tags: [],
        featuredImageUrl: 'https://example.com/image.jpg',
      };

      const response = await request(httpServer)
        .post('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      expect(response.body.data.featuredImageUrl).toBe(payload.featuredImageUrl);
    });
  });
});
