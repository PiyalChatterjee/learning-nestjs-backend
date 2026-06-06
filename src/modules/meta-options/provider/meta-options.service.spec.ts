import { Test, TestingModule } from '@nestjs/testing';
import { MetaOptionsService } from './meta-options.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MetaOption } from '../meta-option.entity';

describe('MetaOptionsService', () => {
  let service: MetaOptionsService;
  let metaOptionRepository: { create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    metaOptionRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaOptionsService,
        { provide: getRepositoryToken(MetaOption), useValue: metaOptionRepository },
      ],
    }).compile();

    service = module.get<MetaOptionsService>(MetaOptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMetaOption', () => {
    it('should create and save a meta option', async () => {
      const dto = { metaValue: '{"key":"value"}' };
      const mockMeta = { id: 1, metaValue: dto.metaValue };
      metaOptionRepository.create.mockReturnValue(mockMeta);
      metaOptionRepository.save.mockResolvedValue(mockMeta);

      const result = await service.createMetaOption(dto);
      expect(result).toEqual(mockMeta);
      expect(metaOptionRepository.create).toHaveBeenCalledWith(dto);
      expect(metaOptionRepository.save).toHaveBeenCalledWith(mockMeta);
    });

    it('should propagate errors from the repository', async () => {
      metaOptionRepository.create.mockReturnValue({});
      metaOptionRepository.save.mockRejectedValue(new Error('DB error'));
      await expect(service.createMetaOption({ metaValue: '{}' })).rejects.toThrow();
    });
  });
});

