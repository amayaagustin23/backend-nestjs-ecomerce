import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IPayloadUserAuth } from '../interfaces/payload.interface';

export const GetCurrentUser = createParamDecorator(
  (key: keyof IPayloadUserAuth | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IPayloadUserAuth;

    return key ? user?.[key] : user;
  },
);
