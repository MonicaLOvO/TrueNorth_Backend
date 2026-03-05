import { join } from 'path';

/**
 * Returns entity file globs for both runtime modes:
 * - source files during development
 * - compiled files after build
 */
export function getTypeOrmEntityGlobs(): string[] {
  return [join(__dirname, '..', '**', '*.entity.{ts,js}')];
}
