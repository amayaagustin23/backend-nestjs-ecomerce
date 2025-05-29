import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { I18nService } from 'nestjs-i18n';
import { awsConfig } from '../../config';
import { FileType } from '../../constants';

@Injectable()
export class AwsService {
  private s3Client: S3Client;
  private logger = new Logger(AwsService.name);

  constructor(private i18n: I18nService) {
    this.s3Client = new S3Client(awsConfig.client);
  }

  async uploadFile(base64File: string, fileType: FileType) {
    const fileExtensionsByMimetype: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/tiff': 'tiff',
      'image/bmp': 'bmp',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'xlsx',
    };
    try {
      const contentType = base64File.split(';')[0].split(':')[1];
      const data = base64File.split(',');
      const buffer = Buffer.from(data[1], 'base64');
      const extension = fileExtensionsByMimetype[contentType] ?? 'file';
      const key = `${fileType}/${crypto.randomUUID()}.${extension}`;
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: awsConfig.s3.bucket,
          ContentType: contentType,
          Key: key,
          Body: buffer,
        }),
      );
      return `https://${awsConfig.s3.bucket}.s3.${awsConfig.client.region}.amazonaws.com/${key}`;
    } catch (err) {
      this.logger.error(`Error uploading ${fileType}`, (err as Error).stack);
      throw new InternalServerErrorException(this.i18n.t('errors.fileUpload'));
    }
  }
}
