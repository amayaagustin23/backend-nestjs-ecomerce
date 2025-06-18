import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
      Logger.log('✅ Database connection successful', 'PrismaService');
    } catch (err) {
      Logger.log(err, 'PrismaService');
    }
  }
}
