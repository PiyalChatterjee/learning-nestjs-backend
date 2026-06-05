import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP exception filter for standardizing error responses.
 *
 * This filter catches all exceptions (including unhandled ones) and formats them
 * into a consistent JSON response structure with HTTP status codes, timestamps,
 * request paths, and error messages.
 *
 * For HttpException instances, uses the exception's status code and response.
 * For unhandled exceptions, returns 500 (Internal Server Error) and logs the error.
 *
 * Response Format:
 * ```json
 * {
 *   "statusCode": 400|500|...,
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "path": "/v1/endpoint",
 *   "message": "Error details or object"
 * }
 * ```
 *
 * @class HttpExceptionFilter
 * @implements {ExceptionFilter}
 * @template T - The type of exception being caught.
 */
@Catch()
export class HttpExceptionFilter<T> implements ExceptionFilter {
  /**
   * Logger instance for recording unhandled exceptions.
   */
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * Catches and formats exceptions into standardized HTTP error responses.
   *
   * @param {T} exception - The exception or error that was thrown.
   * @param {ArgumentsHost} host - The host argument providing access to the HTTP request/response objects.
   *
   * @returns {void} Sends a formatted JSON response to the client.
   *
   * @example
   * // Catching a validation error (400)
   * // Response:
   * // {
   * //   "statusCode": 400,
   * //   "timestamp": "2024-01-15T10:30:00.000Z",
   * //   "path": "/v1/users",
   * //   "message": "Validation failed"
   * // }
   */
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        exception,
        `Unhandled exception on ${request.method} ${request.url}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
