import { DataSource } from 'typeorm';

/**
 * Wipes all entity tables and recreates them using TypeORM's synchronize.
 * Uses the DataSource already initialized by the NestJS app — no second connection needed.
 * Safe to call after each test: the database itself is never dropped.
 *
 * @param dataSource - The TypeORM DataSource instance obtained from the app's DI container
 */
export async function dropDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.synchronize(true);
}
