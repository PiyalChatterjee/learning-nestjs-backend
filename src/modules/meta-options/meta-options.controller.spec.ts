import { Test, TestingModule } from '@nestjs/testing';
import { MetaOptionsController } from './meta-options.controller';
import { MetaOptionsService } from './provider/meta-options.service';

describe('MetaOptionsController', () => {
  let controller: MetaOptionsController;
  let metaOptionsService: { createMetaOption: jest.Mock };

  beforeEach(async () => {
    metaOptionsService = { createMetaOption: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetaOptionsController],
      providers: [
        { provide: MetaOptionsService, useValue: metaOptionsService },
      ],
    }).compile();

    controller = module.get<MetaOptionsController>(MetaOptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createMetaOption', () => {
    it('should call service and return result', async () => {
      const dto = { metaValue: '{"key":"value"}' };
      const mockMeta = { id: 1, ...dto };
      metaOptionsService.createMetaOption.mockResolvedValue(mockMeta);
      const result = await controller.createMetaOption(dto);
      expect(result).toEqual(mockMeta);
      expect(metaOptionsService.createMetaOption).toHaveBeenCalledWith(dto);
    });
  });
});

