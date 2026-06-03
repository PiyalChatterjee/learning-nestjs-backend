import { SetMetadata } from '@nestjs/common';
import { AUTH_TYPE_KEY } from '../constants/auth.constant';
import { AuthType } from '../enums/auth-type.enum';

/**
 * Route/class decorator that assigns one or more authentication strategies.
 *
 * The configured auth types are later read by AuthenticationGuard via Reflector
 * to decide whether a route is public (`AuthType.None`) or requires JWT
 * validation (`AuthType.Bearer`).
 *
 * @param authTypes - One or more authentication modes for the decorated target.
 * @returns Metadata decorator storing auth types under AUTH_TYPE_KEY.
 */
export const Auth = (...authTypes: AuthType[]) =>
  SetMetadata(AUTH_TYPE_KEY, authTypes);
