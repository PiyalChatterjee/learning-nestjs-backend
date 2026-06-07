import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  bootstrapNestApp,
  getAuthToken,
} from '../helpers/bootstrap-nest-app.helper';
import request from 'supertest';
import { validUserPayload } from './users.post.e2e-spec.sample-data';
import { dropDatabase } from '../helpers/drop-database.helper';

describe('[Users] @Post create-many Endpoints (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let httpServer: ReturnType<INestApplication['getHttpServer']>;
  let accessToken: string;

  describe('POST /v1/users/create-many', () => {
    beforeEach(async () => {
      app = await bootstrapNestApp(app);
      dataSource = app.get<DataSource>(DataSource);
      httpServer = app.getHttpServer();
      accessToken = (await getAuthToken(httpServer)).accessToken;
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
        .post('/v1/users/create-many')
        .send({ users: [validUserPayload()] })
        .expect(401);
    });

    it('should create multiple users and return 201', async () => {
      const users = [
        validUserPayload(),
        validUserPayload(),
        validUserPayload(),
      ];

      const response = await request(httpServer)
        .post('/v1/users/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ users })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
    });

    it('should return 400 when users array is empty', async () => {
      await request(httpServer)
        .post('/v1/users/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ users: [] })
        .expect(400);
    });

    it('should return 400 when users field is missing', async () => {
      await request(httpServer)
        .post('/v1/users/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);
    });

    it('should return 400 when any user in the batch has invalid data', async () => {
      const users = [
        validUserPayload(),
        { firstName: '', email: 'not-an-email', password: 'weak' }, // invalid
      ];

      await request(httpServer)
        .post('/v1/users/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ users })
        .expect(400);
    });

    it('should persist all users to the database', async () => {
      const users = [validUserPayload(), validUserPayload()];

      await request(httpServer)
        .post('/v1/users/create-many')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ users })
        .expect(201);

      // Verify via GET — 2 batch users + 1 auth user = 3 total
      const listRes = await request(httpServer)
        .get('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(listRes.body.data.data.length).toBe(3);
    });
  });
});
