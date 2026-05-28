import { NotFoundException } from '@nestjs/common';

/**
 * Asserts that a resource exists and returns it; throws a 404 Not Found exception if it is null or undefined.
 *
 * @param resource - The resource value to check. Can be of any type, null, or undefined.
 * @param resourceName - Human-readable name of the resource type (e.g., 'User', 'Post').
 * @param identifier - Optional ID or email used to identify the resource in the error message.
 * @returns The resource value, narrowed to type T (null/undefined excluded).
 * @throws {NotFoundException} When resource is null or undefined.
 *
 * @example
 * const user = assertResourceExists(
 *   await this.userRepository.findOne({ where: { id } }),
 *   'User',
 *   id,
 * );
 */
export function assertResourceExists<T>(
  resource: T | null | undefined,
  resourceName: string,
  identifier?: string | number,
): T {
  if (resource == null) {
    const suffix = identifier === undefined ? '' : ` with id ${identifier}`;
    throw new NotFoundException(`${resourceName}${suffix} not found`);
  }

  return resource;
}
