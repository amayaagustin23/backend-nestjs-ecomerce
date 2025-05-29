const env = process.env;
import { ConfigService } from '@nestjs/config';

export const getJwtConfig = (config: ConfigService) => ({
  access: {
    secret: config.get<string>('JWT_SECRET_KEY'),
    expiresIn: config.get<string>('JWT_EXPIRES_IN'),
  },
  refresh: {
    secret: config.get<string>('JWT_REFRESH_SECRET_KEY'),
    expiresIn: config.get<string>('JWT_REFRESH_EXPIRES_IN'),
  },
  resetPassword: {
    secret: config.get<string>('JWT_RESET_SECRET_KEY'),
    expiresIn: config.get<string>('JWT_RESET_EXPIRES_IN'),
  },
});

export type JwtPayload = {
  id: string;
  email: string;
  role: string;
};

export const messagingConfig = {
  emailSender: env.EMAIL_SENDER,

  registerUserUrls: {
    backoffice: env.BACKOFFICE_RESET_PASSWORD_URL,
  },
  resetPasswordUrls: {
    backoffice: env.BACKOFFICE_RESET_PASSWORD_URL,
    app: env.APP_RESET_PASSWORD_URL,
  },
} as const;

export const awsConfig = {
  client: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
  },
  s3: {
    bucket: env.S3_BUCKET,
  },
} as const;
