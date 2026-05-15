import {
  Controller,
  Post,
  Get,
  Param,
  ParseUUIDPipe,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  Request,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MinioService } from './minio.service';
import { DRIZZLE } from '../db/drizzle.module';
import type { DrizzleClient } from '../db/drizzle.client';
import { attachments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { extname } from 'path';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
]);

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

@UseGuards(JwtAuthGuard)
@Controller()
export class UploadController {
  constructor(
    private readonly minio: MinioService,
    @Inject(DRIZZLE) private readonly db: DrizzleClient,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_SIZE_BYTES } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { id: string } },
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('File exceeds 25 MB limit');
    }

    const ext = extname(file.originalname).toLowerCase();
    const objectKey = `${randomUUID()}${ext}`;

    await this.minio.upload(file.buffer, objectKey, file.mimetype);

    const [attachment] = await this.db
      .insert(attachments)
      .values({
        uploaderId: req.user.id,
        bucket: this.minio.getBucket(),
        objectKey,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      })
      .returning();

    return attachment;
  }

  @Get('attachments/:id/url')
  async getUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    const [attachment] = await this.db
      .select()
      .from(attachments)
      .where(eq(attachments.id, id));

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (attachment.uploaderId !== req.user.id) {
      // Future: check if requester is in same workspace/DM
      // For now, any authenticated user can generate a presigned URL
    }

    const url = await this.minio.getPresignedUrl(attachment.objectKey);
    return { url, attachment };
  }
}
