import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  RecoverPasswordDto,
  RegisterUserDto,
  ResetPasswordDto,
} from '../users/dto/user.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RoleEnumsGuard } from './guards/roles.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ******** REGISTER ********
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

  // ******** LOGIN ********
  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @HttpCode(HttpStatus.OK)
  login(@Body() credentials: LoginDto) {
    return this.authService.login(credentials);
  }

  // ******** RECOVER PASSWORD ********
  @Post('recover-password')
  @ApiOperation({ summary: 'Recover password' })
  @ApiBody({ type: RecoverPasswordDto })
  @ApiResponse({ status: 200, description: 'Password recovery email sent' })
  @HttpCode(HttpStatus.OK)
  recoverPassword(@Body() body: RecoverPasswordDto) {
    return this.authService.recoverPassword(body);
  }

  // ******** RESET PASSWORD ********
  @UseGuards(AccessTokenGuard, RoleEnumsGuard)
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() body: ResetPasswordDto, @Req() req) {
    const { userId } = req.user;
    return this.authService.resetPassword(userId, body);
  }
}
