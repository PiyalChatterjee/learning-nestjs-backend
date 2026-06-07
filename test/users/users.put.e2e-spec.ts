import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  bootstrapNestApp,
  getAuthToken,
} from '../helpers/bootstrap-nest-app.helper';
import request from 'supertest';
import { validUserPayload } from './users.post.e2e-spec.sample-data';
import { dropDatabase } from '../helpers/drop-database.helper';

describe('[Users] @Put Endpoints (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let httpServer: ReturnType<INestApplication['getHttpServer']>;
  let accessToken: string;
  let authUserId: number;

  describe('PUT /v1/users/:id', () => {
    beforeEach(async () => {
      app = await bootstrapNestApp(app);
      dataSource = app.get<DataSource>(DataSource);
      httpServer = app.getHttpServer();
      const auth = await getAuthToken(httpServer);
      accessToken = auth.accessToken;
      authUserId = auth.createdUserId;
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
      const payload = validUserPayload();
      await request(httpServer)
        .put(`/v1/users/${authUserId}`)
        .send({ firstName: payload.firstName, lastName: payload.lastName, email: payload.email })
        .expect(401);
    });

    it('should fully update a user and return 200 with updated data', async () => {
      const updatePayload = validUserPayload();

      const response = await request(httpServer)
        .put(`/v1/users/${authUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: updatePayload.firstName,
          lastName: updatePayload.lastName,
          email: updatePayload.email,
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(updatePayload.email);
      expect(response.body.data.name).toContain(updatePayload.firstName);
    });

    it('should return 404 when user does not exist', async () => {
      const payload = validUserPayload();
      await request(httpServer)
        .put('/v1/users/9999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ firstName: payload.firstName, lastName: payload.lastName, email: payload.email })
        .expect(404);
    });

    it('should return 409 when updating to an email already in use', async () => {
      // Create a second user
      const secondPayload = validUserPayload();
      await request(httpServer).post('/v1/users').send(secondPayload).expect(201);

      // Attempt to update auth user's email to the second user's email
      const { firstName, lastName } = validUserPayload();
      await request(httpServer)
        .put(`/v1/users/${authUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ firstName, lastName, email: secondPayload.email })
        .expect(409);
    });

    it('should return 400 when required fields are missing', async () => {
      await request(httpServer)
        .put(`/v1/users/${authUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ lastName: 'OnlyLastName' }) // missing firstName and email
        .expect(400);
    });

    it('should return 400 for invalid user id format', async () => {
      const payload = validUserPayload();
      await request(httpServer)
        .put('/v1/users/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ firstName: payload.firstName, lastName: payload.lastName, email: payload.email })
        .expect(400);
    });
  });
});
