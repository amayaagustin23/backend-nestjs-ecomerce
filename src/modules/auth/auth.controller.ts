import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { HasRoles } from 'src/common/decorators/has-roles.decorator';
import { Role } from 'src/constants';
import {
  RecoverPasswordDto,
  RegisterUserDto,
  ResetPasswordDto,
} from '../users/dto/user.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RolesGuard } from './guards/roles.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    type: RegisterUserDto,
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @HttpCode(HttpStatus.CREATED)
  register(@Body() userData: RegisterUserDto) {
    return this.authService.register(userData);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @HttpCode(HttpStatus.OK)
  login(
    @Body() credentials: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(credentials, res);
  }

  @Post('recover-password')
  @ApiOperation({ summary: 'Recover password' })
  @ApiBody({ type: RecoverPasswordDto })
  @ApiResponse({ status: 200, description: 'Password recovery email sent' })
  @HttpCode(HttpStatus.OK)
  recoverPassword(@Body() body: RecoverPasswordDto) {
    return this.authService.recoverPassword(body);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @HasRoles(Role.CLIENT, Role.ADMIN, Role.SUPERADMIN)
  @Get('me')
  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @HttpCode(HttpStatus.OK)
  getMe(@GetCurrentUser('userId') userId: string) {
    return this.authService.getMe(userId);
  }

  @Get('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'dev',
    });
    res.clearCookie('refresh_token', {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'dev',
    });

    return { message: 'Logged out' };
  }
}
