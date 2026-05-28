import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Bootstraps database connectivity without blocking HTTP server startup.
 *
 * Behavior:
 * - Attempts to initialize TypeORM data source during module init.
 * - If initialization fails, starts a background retry loop.
 * - Stops retry loop as soon as connection succeeds.
 */
@Injectable()
export class DatabaseConnectionBootstrap
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DatabaseConnectionBootstrap.name);
  private retryTimer?: NodeJS.Timeout;

  /**
   * @param dataSource TypeORM data source used for runtime initialization.
   */
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Runs on module startup and performs initial connection attempt.
   */
  public async onModuleInit(): Promise<void> {
    const isInitialized = await this.tryInitialize();

    if (!isInitialized) {
      this.startRetryLoop();
    }
  }

  /**
   * Runs on module teardown and clears any active retry timer.
   */
  public onModuleDestroy(): void {
    this.stopRetryLoop();
  }

  /**
   * Attempts to initialize the data source one time.
   *
   * @returns true when data source is initialized; otherwise false.
   */
  private async tryInitialize(): Promise<boolean> {
    if (this.dataSource.isInitialized) {
      this.stopRetryLoop();
      return true;
    }

    try {
      await this.dataSource.initialize();
      this.logger.log('Database connection initialized successfully.');
      this.stopRetryLoop();
      return true;
    } catch {
      this.logger.warn(
        'Database unavailable. Retrying connection in 5 seconds...',
      );
      return false;
    }
  }

  /**
   * Starts a retry interval to re-attempt DB initialization every 5 seconds.
   */
  private startRetryLoop(): void {
    if (this.retryTimer) {
      return;
    }

    this.retryTimer = setInterval(() => {
      void this.tryInitialize();
    }, 5000);

    this.retryTimer.unref?.();
  }

  /**
   * Stops and clears the retry interval when it exists.
   */
  private stopRetryLoop(): void {
    if (!this.retryTimer) {
      return;
    }

    clearInterval(this.retryTimer);
    this.retryTimer = undefined;
  }
}