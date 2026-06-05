import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './providers/uploads.service';
import { Upload } from './upload.entity';

/**
 * Uploads feature module that provides file upload functionality.
 * Integrates Azure Blob Storage for file persistence.
 */
@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
  imports: [TypeOrmModule.forFeature([Upload])],
  exports: [UploadsService],
})
export class UploadsModule {}
