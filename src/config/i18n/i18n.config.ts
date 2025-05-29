import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
} from 'nestjs-i18n';
import * as path from 'path';

const I18nModuleConfig = async (): Promise<any> => {
  const options: any = {
    typesOutputPath: path.join(
      __dirname,
      '../../../src/i18n/generated/types.ts',
    ),
    fallbackLanguage: 'es',
    loaderOptions: {
      path: path.join(__dirname, '../../../src/i18n'),
      watch: true,
    },
    resolvers: [
      { use: HeaderResolver, options: ['lang'] },
      AcceptLanguageResolver,
      new HeaderResolver(['x-language']),
    ],
  };
  return I18nModule.forRoot(options);
};

export default I18nModuleConfig;
