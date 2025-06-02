import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { JwtPayload } from 'src/config';
import { MessagingService } from 'src/services/messaging/messaging.service';
import { comparePassword } from 'src/utils/password';
import {
  RecoverPasswordDto,
  RegisterUserDto,
  ResetPasswordDto,
} from '../users/dto/user.dto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly messagingService: MessagingService,
  ) {}

  private get jwtConfig() {
    return {
      access: {
        secret: this.configService.get<string>('JWT_SECRET_KEY'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      },
      refresh: {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET_KEY'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      },
      resetPassword: {
        secret: this.configService.get<string>('JWT_RESET_SECRET_KEY'),
        expiresIn: this.configService.get<string>('JWT_RESET_EXPIRES_IN'),
      },
    };
  }

  private get messagingConfig() {
    return {
      emailSender: this.configService.get<string>('EMAIL_SENDER'),
      registerUserUrls: {
        backoffice: this.configService.get<string>(
          'BACKOFFICE_RESET_PASSWORD_URL',
        ),
      },
      resetPasswordUrls: {
        backoffice: this.configService.get<string>(
          'BACKOFFICE_RESET_PASSWORD_URL',
        ),
        app: this.configService.get<string>('APP_RESET_PASSWORD_URL'),
      },
    };
  }

  async register(userData: RegisterUserDto) {
    const user = await this.userService.registerUserClient(userData);

    await this.messagingService.sendRegisterUserEmail({
      from: this.messagingConfig.emailSender,
      to: user.email,
      user,
    });

    return user;
  }

  async login(credentials: LoginDto, res: Response) {
    const findUser = await this.userService.get({
      where: { email: credentials.email },
    });

    if (!findUser) {
      throw new ForbiddenException(
        this.i18n.t('errors.validations.invalidCredentials'),
      );
    }

    const isCorrectPassword = await comparePassword(
      credentials.password,
      findUser.password,
    );

    if (!isCorrectPassword) {
      throw new ForbiddenException(
        this.i18n.t('errors.validations.invalidCredentials'),
      );
    }

    const { accessToken, refreshToken } = await this.createTokens({
      id: findUser.id,
      email: findUser.email,
      role: findUser.role,
    });

    // Seteá la cookie segura
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24, // 1 día
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
    });

    return {
      user: await this.userService.mapToBasicUserInfoFromUser(findUser),
      // opcional: podrías omitir tokens si ya van en cookies
    };
  }

  async recoverPassword(body: RecoverPasswordDto) {
    const { email } = body;

    const findUser = await this.userService.get({ where: { email } });

    if (!findUser) {
      throw new ForbiddenException(this.i18n.t('errors.emailNotRegistered'));
    }

    const token = await this.jwtService.signAsync(
      {
        id: findUser.id,
        email: findUser.email,
        role: findUser.role,
      },
      this.jwtConfig.resetPassword,
    );

    await this.messagingService.sendRecoverPasswordEmail({
      from: this.messagingConfig.emailSender,
      to: findUser.email,
      redirectUrl: `${this.messagingConfig.resetPasswordUrls.backoffice}/${token}`,
    });

    return {
      message: this.i18n.t('emails.sendEmailURL'),
    };
  }

  async resetPassword(id: string, body: ResetPasswordDto) {
    const findUser = await this.userService.getRaw({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        password: true,
      },
    });

    if (!findUser) throw new UnauthorizedException();

    if (body.password !== body.confirmPassword) {
      throw new BadRequestException(
        this.i18n.t('errors.validations.passwordComparison'),
      );
    }

    const samePassword = await comparePassword(
      body.password,
      findUser.password,
    );

    if (samePassword) {
      throw new ForbiddenException(
        this.i18n.t('errors.validations.samePassword'),
      );
    }

    await this.userService.changePassword(id, body);

    await this.messagingService.sendResetPasswordEmail({
      from: this.messagingConfig.emailSender,
      to: findUser.email,
    });

    return {
      message: this.i18n.t('emails.changePassword'),
    };
  }

  async getMe(id: string) {
    const user = await this.userService.get({ where: { id } });
    return this.userService.mapToBasicUserInfoFromUser(user);
  }
  private async createTokens(payload: JwtPayload) {
    return {
      accessToken: await this.jwtService.signAsync(
        payload,
        this.jwtConfig.access,
      ),
      refreshToken: await this.jwtService.signAsync(
        payload,
        this.jwtConfig.refresh,
      ),
    };
  }
}
