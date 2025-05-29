import { Injectable, ValidationError } from '@nestjs/common';
import { I18nValidationExceptionFilter } from 'nestjs-i18n';

@Injectable()
export class ValidationErrorExceptionFilter extends I18nValidationExceptionFilter {
  constructor() {
    super({
      detailedErrors: true,
      responseBodyFormatter: (_, exception, formattedErrors) => {
        const errorMessages = (formattedErrors as ValidationError[]).flatMap(
          (error) => Object.values(error.constraints as Record<string, string>),
        );

        const [firstErrorMessage] = errorMessages;

        return {
          statusCode: exception.getStatus(),
          message: errorMessages.length > 1 ? errorMessages : firstErrorMessage,
          errors: formattedErrors,
        };
      },
    });
  }
}
