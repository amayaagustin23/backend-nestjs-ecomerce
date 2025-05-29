import { Module } from '@nestjs/common';
import { UploadService } from './aws.service';

@Module({
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
