import { Module } from '@nestjs/common';
import { MetaOptionsController } from './meta-options.controller';
import { MetaOption } from './meta-option.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetaOptionsService } from './provider/meta-options.service';

/**
 * Meta-options module managing post metadata and SEO configurations.
 * Provides endpoints for CRUD operations on post metadata.
 * Supports one-to-one relationship with posts for flexible metadata storage.
 */
@Module({
  controllers: [MetaOptionsController],
  imports: [TypeOrmModule.forFeature([MetaOption])],
  providers: [MetaOptionsService],
})
export class MetaOptionsModule {}
