import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { bootstrapNestApp, getAuthToken } from '../helpers/bootstrap-nest-app.helper';
import { dropDatabase } from '../helpers/drop-database.helper';
import { validPostPayload } from './posts.post.e2e-spec.sample-data';

describe('POST /v1/posts/create-many (e2e)', () => {
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

  describe('POST /v1/posts/create-many', () => {
    it('should create multiple posts in bulk with 201 response', async () => {
      const posts = [validPostPayload(), validPostPayload(), validPostPayload()];

      const response = await request(httpServer)
        .post('/v1/posts/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ posts })
        .expect(201);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0]).toHaveProperty('id');
    });

    it('should return 401 when no authorization token is provided', async () => {
      const posts = [validPostPayload()];

      await request(httpServer)
        .post('/v1/posts/create-many')
        .send({ posts })
        .expect(401);
    });

    it('should return 400 when posts array is empty', async () => {
      await request(httpServer)
        .post('/v1/posts/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ posts: [] })
        .expect(400);
    });

    it('should return 400 when batch size exceeds limit', async () => {
      const posts = Array(51)
        .fill(null)
        .map(() => validPostPayload());

      await request(httpServer)
        .post('/v1/posts/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ posts })
        .expect(400);
    });

    it('should return 400 when a post is missing required field', async () => {
      const posts = [
        validPostPayload(),
        {
          postType: 'post',
          slug: 'missing-title',
          status: 'draft',
          publishOn: new Date().toISOString(),
          tags: [],
          // missing title
        },
      ];

      await request(httpServer)
        .post('/v1/posts/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ posts })
        .expect(400);
    });

    it('should return 400 when duplicate slugs detected in batch', async () => {
      const slug = 'duplicate-slug';
      const posts = [
        { ...validPostPayload(), slug },
        { ...validPostPayload(), slug },
      ];

      await request(httpServer)
        .post('/v1/posts/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ posts })
        .expect(400);
    });

    it('should persist all created posts to database', async () => {
      const posts = [validPostPayload(), validPostPayload()];

      const createResponse = await request(httpServer)
        .post('/v1/posts/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ posts })
        .expect(201);

      expect(createResponse.body.data.length).toBe(2);

      const listResponse = await request(httpServer)
        .get('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(listResponse.body.data.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should verify atomic transaction - all posts created or none', async () => {
      const validPost = validPostPayload();
      const slug = validPost.slug;
      
      // First batch - create a post with specific slug
      await request(httpServer)
        .post('/v1/posts/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ posts: [validPost] })
        .expect(201);

      // Second batch - try to create posts including one with same slug (should fail)
      const conflictingPosts = [
        validPostPayload(),
        { ...validPostPayload(), slug }, // Duplicate slug
      ];

      await request(httpServer)
        .post('/v1/posts/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ posts: conflictingPosts })
        .expect(409);

      // Verify that no posts from the failed batch were created
      const listResponse = await request(httpServer)
        .get('/v1/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Should only have the first post, not the conflicting batch
      expect(listResponse.body.data.data.length).toBe(1);
    });
  });
});
