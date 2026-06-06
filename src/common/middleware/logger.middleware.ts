import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * HTTP request logger middleware.
 *
 * Logs the HTTP method and full URL of every incoming request to the NestJS
 * application logger. Runs at the start of the request pipeline, before
 * guards, interceptors, and route handlers.
 *
 * @example
 * // Output written to the NestJS logger:
 * // [LoggerMiddleware] [GET] /v1/users?page=1&limit=10
 * // [LoggerMiddleware] [POST] /v1/posts
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  /**
   * Intercepts the request, logs the HTTP method and original URL, then
   * calls `next()` to pass control to the next middleware or route handler.
   *
   * @param req - The incoming Express request object.
   * @param _res - The Express response object (unused at this stage).
   * @param next - Callback to invoke the next middleware or handler.
   */
  use(req: Request, _res: Response, next: NextFunction): void {
    this.logger.log(`[${req.method}] ${req.originalUrl}`);
    next();
  }
}
