import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { bootstrapNestApp, getAuthToken } from '../helpers/bootstrap-nest-app.helper';
import { dropDatabase } from '../helpers/drop-database.helper';
import {
  validTagPayload,
  tagWithMissingName,
  tagWithMissingSlug,
} from './tags.post.e2e-spec.sample-data';

describe('POST /v1/tags (e2e)', () => {
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

  describe('POST /v1/tags', () => {
    it('should create a tag with valid payload', async () => {
      const payload = validTagPayload();
      const response = await request(httpServer)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(payload.name);
      expect(response.body.data.slug).toBe(payload.slug);
      expect(response.body.data.description).toBe(payload.description);
    });

    it('should return 401 when no authorization token is provided', async () => {
      const payload = validTagPayload();
      await request(httpServer)
        .post('/v1/tags')
        .send(payload)
        .expect(401);
    });

    it('should return 400 when name is missing', async () => {
      const payload = tagWithMissingName();
      await request(httpServer)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('should return 400 when slug is missing', async () => {
      const payload = tagWithMissingSlug();
      await request(httpServer)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(400);
    });

    it('should enforce name uniqueness constraint with 409 conflict', async () => {
      const payload = validTagPayload();

      // Create first tag
      await request(httpServer)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      // Attempt to create second tag with same name
      await request(httpServer)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(409);
    });

    it('should enforce slug uniqueness constraint with 409 conflict', async () => {
      const payload1 = validTagPayload();
      const payload2 = {
        name: 'Different Name',
        slug: payload1.slug, // Same slug
      };

      // Create first tag
      await request(httpServer)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload1)
        .expect(201);

      // Attempt to create second tag with same slug
      await request(httpServer)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload2)
        .expect(409);
    });

    it('should persist tag to database', async () => {
      const payload = validTagPayload();
      const createResponse = await request(httpServer)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const tagId = createResponse.body.data.id;

      const getResponse = await request(httpServer)
        .get(`/v1/tags/${tagId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.data.name).toBe(payload.name);
    });

    it('should allow tags with feature image URL', async () => {
      const payload = {
        name: 'Tag with Image',
        slug: 'https://example.com/tags/tag-with-image',
        featureImageUrl: 'https://example.com/tag-image.jpg',
      };

      const response = await request(httpServer)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      expect(response.body.data.featureImageUrl).toBe(payload.featureImageUrl);
    });

    it('should allow tags with optional schema field', async () => {
      const payload = {
        name: 'Tag with Schema',
        slug: 'https://example.com/tags/tag-with-schema',
        schema: '{"type": "tag"}',
      };

      const response = await request(httpServer)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      // Schema is stored and returned (exact format may vary)
      expect(response.body.data.schema).toBeDefined();
    });
  });
});
