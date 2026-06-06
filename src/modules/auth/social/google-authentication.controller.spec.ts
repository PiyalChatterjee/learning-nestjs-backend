import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAuthenticationController } from './google-authentication.controller';
import { GoogleAuthenticationService } from './providers/google-authentication.service';

describe('GoogleAuthenticationController', () => {
  let controller: GoogleAuthenticationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoogleAuthenticationController],
      providers: [
        {
          provide: GoogleAuthenticationService,
          useValue: { authenticate: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<GoogleAuthenticationController>(
      GoogleAuthenticationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
