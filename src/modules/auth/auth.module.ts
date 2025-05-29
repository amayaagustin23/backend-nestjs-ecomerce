import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import JwtModuleConfig from 'src/config/jwt/jwt.config';
import { MessagingModule } from '../../services/messaging/messaging.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
  imports: [ConfigModule, JwtModuleConfig(), UsersModule, MessagingModule],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy],
  exports: [AuthService],
})
export class AuthModule {}
