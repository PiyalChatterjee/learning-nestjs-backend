import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { bootstrapNestApp, getAuthToken } from '../helpers/bootstrap-nest-app.helper';
import { dropDatabase } from '../helpers/drop-database.helper';
import { validTagPayload } from './tags.post.e2e-spec.sample-data';

describe('DELETE /v1/tags/:id (e2e)', () => {
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

  describe('DELETE /v1/tags/:id', () => {
    it('should delete a tag and return 200 with success message', async () => {
      const payload = validTagPayload();
      const createResponse = await request(httpServer)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const tagId = createResponse.body.data.id;

      const response = await request(httpServer)
        .delete(`/v1/tags/${tagId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.message).toBeDefined();
      expect(response.body.data.message).toContain('successfully');
    });

    it('should return 401 when no authorization token is provided', async () => {
      const payload = validTagPayload();
      const createResponse = await request(httpServer)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const tagId = createResponse.body.data.id;

      await request(httpServer)
        .delete(`/v1/tags/${tagId}`)
        .expect(401);
    });

    it('should return 404 when tag does not exist', async () => {
      await request(httpServer)
        .delete('/v1/tags/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 400 when tag id is invalid format', async () => {
      await request(httpServer)
        .delete('/v1/tags/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should persist deletion to database', async () => {
      const payload = validTagPayload();
      const createResponse = await request(httpServer)
        .post('/v1/tags')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload)
        .expect(201);

      const tagId = createResponse.body.data.id;

      await request(httpServer)
        .delete(`/v1/tags/${tagId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify tag is deleted by attempting to fetch it
      await request(httpServer)
        .get(`/v1/tags/${tagId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
