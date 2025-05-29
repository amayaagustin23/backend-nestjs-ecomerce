import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
// import * as fs from 'fs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const startTime = Date.now();

    return next.handle().pipe(
      tap((data) => {
        const date = new Date();
        const endTime = Date.now();
        const resTime = endTime - startTime;
        const formatDate = date.toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        const handler = context.getHandler();
        const handlerName = handler.name || 'Unknown Handler';
        const controller = context.getClass().name;

        console.log(
          '\x1b[37m',
          `🚀 ${formatDate} - ${request.method} ${request.path} ${response.statusCode} ${resTime}ms - Controller: ${controller} -> ${handlerName}`,
        );
        console.log(
          '\x1b[32m',
          `✅ RESPONSE: ${JSON.stringify(data, null, 2)}`,
        );
        console.log('\n');
      }),

      catchError((error) => {
        const handler = context.getHandler();
        const handlerName = handler.name || 'Unknown Handler';
        const controller = context.getClass().name;

        const date = new Date();
        const errorFormatDate = date.toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const errorMessage = `❌ ERROR: ${errorFormatDate} - ${request.method} ${request.path} ${error.status || '500'} ${Date.now() - startTime}ms - Controller: ${controller} -> ${handlerName}`;
        const errorDetails = JSON.stringify(
          error?.response || error?.response?.message,
          null,
          2,
        );

        // Guardar logs de errores
        // fs.appendFileSync('error.log', `${errorMessage}\n${errorDetails}\n\n`);

        console.error('\x1b[31m', errorMessage);
        console.error('\x1b[33m', `⚠️ ERROR DETAIL: ${errorDetails}`);
        console.error('\n');
        throw error;
      }),
    );
  }
}
