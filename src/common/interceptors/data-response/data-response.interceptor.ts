import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, map } from 'rxjs';

/**
 * Globally transforms HTTP response bodies to include API version metadata.
 *
 * Wraps successful response data in a standardized envelope containing:
 * - apiVersion: The current API version from configuration
 * - data: The actual response payload from the controller
 *
 * Applied automatically to all routes via APP_INTERCEPTOR provider.
 *
 * Response Format:
 * ```json
 * {
 *   "apiVersion": "1.0",
 *   "data": { ...actual response... }
 * }
 * ```
 *
 * @class DataResponseInterceptor
 * @implements {NestInterceptor}
 */
@Injectable()
export class DataResponseInterceptor implements NestInterceptor {
  /**
   * Initializes the interceptor with configuration service.
   *
   * @param {ConfigService} configService - Service for accessing application configuration,
   *                                         used to retrieve the API version.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Intercepts the request-response lifecycle and wraps responses with API version.
   *
   * @param {ExecutionContext} context - The execution context containing request/response information.
   * @param {CallHandler} next - The next handler in the middleware chain.
   *
   * @returns {Observable<any>} An observable that emits the wrapped response data.
   *
   * @example
   * // Original response: { id: 1, name: 'John Doe' }
   * // Intercepted response:
   * // {
   * //   "apiVersion": "1.0",
   * //   "data": { "id": 1, "name": "John Doe" }
   * // }
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        apiVersion: this.configService.get<string>('appConfig.apiVersion'),
        data,
      })),
    );
  }
}
