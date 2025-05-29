import { Module } from '@nestjs/common';
import JwtModuleConfig from 'src/config/jwt/jwt.config';
import { CryptoModule } from 'src/services/crypto/crypto.module';
import { MessagingModule } from '../../services/messaging/messaging.module';
import { PrismaModule } from '../../services/prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, JwtModuleConfig(), MessagingModule, CryptoModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
