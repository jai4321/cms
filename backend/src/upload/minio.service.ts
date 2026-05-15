import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private client: Minio.Client;
  private bucket: string;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.bucket = this.config.getOrThrow<string>('MINIO_BUCKET');
    this.client = new Minio.Client({
      endPoint: this.config.getOrThrow<string>('MINIO_ENDPOINT'),
      port: parseInt(this.config.getOrThrow<string>('MINIO_PORT'), 10),
      useSSL: this.config.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.config.getOrThrow<string>('MINIO_ACCESS_KEY'),
      secretKey: this.config.getOrThrow<string>('MINIO_SECRET_KEY'),
    });

    await this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Bucket "${this.bucket}" created`);
      }
    } catch (err) {
      this.logger.error('Failed to ensure MinIO bucket', err);
    }
  }

  async upload(
    buffer: Buffer,
    objectKey: string,
    mimeType: string,
  ): Promise<void> {
    const stream = Readable.from(buffer);
    await this.client.putObject(this.bucket, objectKey, stream, buffer.length, {
      'Content-Type': mimeType,
    });
  }

  async getPresignedUrl(objectKey: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, objectKey, expirySeconds);
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client.removeObject(this.bucket, objectKey);
  }

  getBucket(): string {
    return this.bucket;
  }
}
