import { NotFoundException } from '@nestjs/common';

/**
 * Ensures a resource exists and throws a 404 error when it does not.
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
