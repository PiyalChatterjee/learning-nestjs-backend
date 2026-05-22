import { Test, TestingModule } from '@nestjs/testing';
import { MetaOptionsService } from './meta-options.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MetaOption } from '../meta-option.entity';

describe('MetaOptionsService', () => {
  let service: MetaOptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaOptionsService,
        {
          provide: getRepositoryToken(MetaOption),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MetaOptionsService>(MetaOptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
