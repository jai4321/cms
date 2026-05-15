import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MinioService } from './minio.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [ConfigModule],
  providers: [MinioService],
  controllers: [UploadController],
  exports: [MinioService],
})
export class UploadModule {}
