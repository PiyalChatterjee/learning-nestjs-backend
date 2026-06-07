import { INestApplication } from '@nestjs/common';
import { dropDatabase } from '../helpers/drop-database.helper';
import { DataSource } from 'typeorm';
import { bootstrapNestApp } from '../helpers/bootstrap-nest-app.helper';
import request from 'supertest';
import { User } from '../../src/modules/users/user.entity';
import { MailService } from '../../src/modules/mail/providers/mail.service';
import {
  validUserPayload,
  userWithMissingFirstName,
  userWithInvalidEmail,
  userWithWeakPassword,
  generateRandomUser,
} from './users.post.e2e-spec.sample-data';

describe('[Users] @Post Endpoints (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let httpServer: ReturnType<INestApplication['getHttpServer']>;
  beforeEach(async () => {
    app = await bootstrapNestApp(app); // Initialize the NestJS app and get the DataSource from the app's DI container
    dataSource = app.get<DataSource>(DataSource); // Get the TypeORM DataSource instance from the app's DI container
    httpServer = app.getHttpServer(); // Get the HTTP server instance from the NestJS app
  });

  afterEach(async () => {
    // Only cleanup if database connection is still active
    if (dataSource && dataSource.isInitialized) {
      await dropDatabase(dataSource); // Wipe all tables after each test
    }
    if (app) {
      await app.close();
    }
  });

  it('should create a new user with valid data', async () => {
    const randomUser = generateRandomUser();
    await request(httpServer).post('/v1/users').send(randomUser).expect(201);
  });
  it('should return 400 Bad Request when required fields are missing', async () => {
    await request(httpServer)
      .post('/v1/users')
      .send(userWithMissingFirstName())
      .expect(400);
  });

  it('should return 400 Bad Request when email is invalid', async () => {
    await request(httpServer)
      .post('/v1/users')
      .send(userWithInvalidEmail())
      .expect(400);
  });

  it('should return 400 Bad Request when password is too short', async () => {
    await request(httpServer)
      .post('/v1/users')
      .send(userWithWeakPassword())
      .expect(400);
  });

  it('should return 409 Conflict when email already exists', async () => {
    // Create the first user
    const userPayload = validUserPayload();
    await request(httpServer).post('/v1/users').send(userPayload).expect(201);

    // Attempt to create another user with the same email
    await request(httpServer).post('/v1/users').send(userPayload).expect(409);
  });
  it('should return 201 Created and user data when user is successfully created', async () => {
    const userPayload = validUserPayload();
    const response = await request(httpServer)
      .post('/v1/users')
      .send(userPayload)
      .expect(201);

    // Verify response body contains user data (nested under data property)
    expect(response.body).toBeDefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.firstName).toBe(userPayload.firstName);
    expect(response.body.data.lastName).toBe(userPayload.lastName);
    expect(response.body.data.email).toBe(userPayload.email);
  });

  it('should hash the password before saving to the database', async () => {
    const userPayload = validUserPayload();
    const response = await request(httpServer)
      .post('/v1/users')
      .send(userPayload)
      .expect(201);

    // Fetch user from database and verify password is hashed (not plaintext)
    const userRepository = dataSource.getRepository(User);
    const savedUser = await userRepository.findOne({
      where: { email: userPayload.email },
    });

    expect(savedUser).toBeDefined();
    expect(savedUser.password).not.toBe(userPayload.password);
    expect(savedUser.password.length).toBeGreaterThan(0);
  });

  it('should send a welcome email after user creation', async () => {
    const userPayload = validUserPayload();
    const mailService = app.get<MailService>(MailService);
    const sendWelcomeEmailSpy = jest.spyOn(mailService, 'sendWelcomeEmail');

    await request(httpServer).post('/v1/users').send(userPayload).expect(201);

    // Verify that sendWelcomeEmail was called
    expect(sendWelcomeEmailSpy).toHaveBeenCalled();
    expect(sendWelcomeEmailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        email: userPayload.email,
      }),
    );
  });
  it('should return 503 Service Unavailable when database is unreachable', async () => {
    // Close the database connection to simulate unreachable database
    await dataSource.destroy();

    const userPayload = validUserPayload();
    await request(httpServer).post('/v1/users').send(userPayload).expect(503);

    // Skip cleanup since database is already destroyed
  });

  it('should return 408 Request Timeout when database operation times out', async () => {
    const userRepository = dataSource.getRepository(User);
    const saveSpy = jest
      .spyOn(userRepository, 'save')
      .mockRejectedValueOnce(new Error('Query timeout'));

    const userPayload = validUserPayload();
    await request(httpServer).post('/v1/users').send(userPayload).expect(408);

    saveSpy.mockRestore();
  });
  it('endpoints should be publicly accessible without authentication', async () => {
    await request(httpServer)
      .post('/v1/users')
      .send(validUserPayload())
      .expect(201);
  });
  it('should handle unexpected errors gracefully and return 500 Internal Server Error', async () => {
    // Mock a provider to throw an unexpected error
    const mailService = app.get<MailService>(MailService);
    jest
      .spyOn(mailService, 'sendWelcomeEmail')
      .mockRejectedValueOnce(new Error('Unexpected mail service error'));

    const userPayload = validUserPayload();
    await request(httpServer).post('/v1/users').send(userPayload).expect(500);
  });
});
