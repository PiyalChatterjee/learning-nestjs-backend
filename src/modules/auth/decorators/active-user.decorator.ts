import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IActiveUser } from '../interfaces/active-user.interface';
import { REQUEST_USER_KEY } from '../constants/auth.constant';

/**
 * Parameter decorator that returns the authenticated user payload attached by AccessTokenGuard.
 *
 * Usage:
 * - `@ActiveUser()` returns the full active-user object.
 * - `@ActiveUser('email')` returns only one field from the active-user object.
 *
 * @param field - Optional key of IActiveUser to extract.
 * @param ctx - Nest execution context used to access the HTTP request.
 * @returns The full active-user payload or a selected field value.
 */
export const ActiveUser = createParamDecorator(
  (field: keyof IActiveUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request[REQUEST_USER_KEY] as IActiveUser;
    return field ? user[field] : user;
  },
);
