import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/i18n/generated/types';

export const CORS: CorsOptions = {
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
};

export enum RoleEnum {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export type FileType = 'img' | 'document';

export const useTranslation = i18nValidationMessage<I18nTranslations>;
