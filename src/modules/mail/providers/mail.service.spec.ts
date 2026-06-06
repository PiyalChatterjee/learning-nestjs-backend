import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('MailService', () => {
  let service: MailService;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    mailerService = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWelcomeEmail', () => {
    it('should send a welcome email to a user', async () => {
      const user = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        id: 1,
        password: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        posts: [],
      };

      await service.sendWelcomeEmail(user);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Welcome to Our Platform!',
        template: './welcome',
        text: 'Hello John Doe, welcome to our platform!',
        context: {
          name: 'John Doe',
        },
      });
    });

    it('should handle user with no lastName', async () => {
      const user = {
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: null,
        id: 1,
        password: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        posts: [],
      };

      await service.sendWelcomeEmail(user);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Welcome to Our Platform!',
        template: './welcome',
        text: 'Hello Jane, welcome to our platform!',
        context: {
          name: 'Jane',
        },
      });
    });

    it('should handle user with empty lastName', async () => {
      const user = {
        email: 'test@example.com',
        firstName: 'Bob',
        lastName: '',
        id: 1,
        password: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        posts: [],
      };

      await service.sendWelcomeEmail(user);

      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Welcome to Our Platform!',
        template: './welcome',
        text: 'Hello Bob, welcome to our platform!',
        context: {
          name: 'Bob',
        },
      });
    });
  });
});
