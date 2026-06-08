import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { bootstrapNestApp, getAuthToken } from '../helpers/bootstrap-nest-app.helper';
import { dropDatabase } from '../helpers/drop-database.helper';
import { validTagPayload } from './tags.post.e2e-spec.sample-data';

describe('POST /v1/tags/create-many (e2e)', () => {
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

  describe('POST /v1/tags/create-many', () => {
    it('should create multiple tags in bulk with 201 response', async () => {
      const tags = [validTagPayload(), validTagPayload(), validTagPayload()];

      const response = await request(httpServer)
        .post('/v1/tags/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tags })
        .expect(201);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0]).toHaveProperty('id');
    });

    it('should return 401 when no authorization token is provided', async () => {
      const tags = [validTagPayload()];

      await request(httpServer)
        .post('/v1/tags/create-many')
        .send({ tags })
        .expect(401);
    });

    it('should return 400 when tags array is empty', async () => {
      await request(httpServer)
        .post('/v1/tags/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tags: [] })
        .expect(400);
    });

    it('should return 400 when batch size exceeds limit', async () => {
      const tags = Array(101)
        .fill(null)
        .map(() => validTagPayload());

      await request(httpServer)
        .post('/v1/tags/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tags })
        .expect(400);
    });

    it('should return 400 when a tag is missing required field', async () => {
      const tags = [
        validTagPayload(),
        {
          slug: 'missing-name',
          // missing name
        },
      ];

      await request(httpServer)
        .post('/v1/tags/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tags })
        .expect(400);
    });

    it('should return 400 when duplicate names detected in batch', async () => {
      const name = 'duplicate-name';
      const slug1 = 'duplicate-name-1';
      const slug2 = 'duplicate-name-2';
      const tags = [
        { ...validTagPayload(), name, slug: slug1 },
        { ...validTagPayload(), name, slug: slug2 },
      ];

      await request(httpServer)
        .post('/v1/tags/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tags })
        .expect(400);
    });

    it('should return 400 when duplicate slugs detected in batch', async () => {
      const slug = 'duplicate-slug';
      const tags = [
        { ...validTagPayload(), slug },
        { ...validTagPayload(), slug },
      ];

      await request(httpServer)
        .post('/v1/tags/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tags })
        .expect(400);
    });

    it('should persist all created tags to database', async () => {
      const tags = [validTagPayload(), validTagPayload()];

      const createResponse = await request(httpServer)
        .post('/v1/tags/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tags })
        .expect(201);

      expect(createResponse.body.data.length).toBe(2);

      const listResponse = await request(httpServer)
        .get('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(listResponse.body.data.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should verify atomic transaction - all tags created or none', async () => {
      const validTag = validTagPayload();
      const slug = validTag.slug;

      // First batch - create a tag with specific slug
      await request(httpServer)
        .post('/v1/tags/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tags: [validTag] })
        .expect(201);

      // Second batch - try to create tags including one with same slug (should fail)
      const conflictingTags = [
        validTagPayload(),
        { ...validTagPayload(), slug }, // Duplicate slug
      ];

      await request(httpServer)
        .post('/v1/tags/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ tags: conflictingTags })
        .expect(409);

      // Verify that no tags from the failed batch were created
      const listResponse = await request(httpServer)
        .get('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Should only have the first tag, not the conflicting batch
      expect(listResponse.body.data.data.length).toBe(1);
    });
  });
});
