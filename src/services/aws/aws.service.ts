import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import * as mime from 'mime-types';
import { extname } from 'path';
import { awsConfig } from 'src/config';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UploadService {
  private s3 = new S3Client({
    region: awsConfig.client.region,
    credentials: {
      accessKeyId: awsConfig.client.accessKeyId,
      secretAccessKey: awsConfig.client.secretAccessKey,
    },
  });

  async upload(file: Express.Multer.File): Promise<string> {
    const extension =
      extname(file.originalname) || mime.extension(file.mimetype) || '.jpg';
    const fileName = `products/${uuid()}${extension}`;

    const command = new PutObjectCommand({
      Bucket: awsConfig.s3.bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.s3.send(command);

    return `https://${awsConfig.s3.bucket}.s3.${awsConfig.client.region}.amazonaws.com/${fileName}`;
  }
}
