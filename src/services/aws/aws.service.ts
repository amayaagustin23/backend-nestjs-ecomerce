import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mime from 'mime-types';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UploadService {
  private s3: S3Client;
  private region: string;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION')!;
    this.bucket = this.configService.get<string>('S3_BUCKET')!;
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        )!,
      },
    });
  }

  async upload(file: Express.Multer.File): Promise<string> {
    const extension =
      extname(file.originalname) ||
      `.${mime.extension(file.mimetype)}` ||
      '.jpg';
    const fileName = `products/${uuid()}${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3.send(command);

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileName}`;
  }
}
