import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  onModuleInit() {
    this.$connect()
      .then(() =>
        Logger.log('✅ Database connection successful', 'PrismaService'),
      )
      .catch((err) => Logger.log(err));
  }
}
