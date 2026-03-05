import { existsSync, readdirSync } from 'fs';
import { extname, join } from 'path';
import { Provider, Type } from '@nestjs/common';

type ClassType = Type<unknown>;

function getFilesRecursive(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFilesRecursive(fullPath));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function loadExportedClasses(files: string[], classNamePattern: RegExp): ClassType[] {
  const collected: ClassType[] = [];

  for (const filePath of files) {
    const extension = extname(filePath).toLowerCase();
    if (!['.js', '.ts'].includes(extension)) {
      continue;
    }
    if (filePath.endsWith('.d.ts') || filePath.endsWith('.map')) {
      continue;
    }

    try {
      const loadedModule = require(filePath);
      for (const exportedValue of Object.values(loadedModule)) {
        if (
          typeof exportedValue === 'function' &&
          exportedValue.prototype &&
          classNamePattern.test(exportedValue.name)
        ) {
          collected.push(exportedValue as ClassType);
        }
      }
    } catch {
      // Skip modules that cannot be loaded in current runtime mode.
    }
  }

  return Array.from(new Set(collected));
}

export function autoRegisterProviders(moduleRootDir: string): Provider[] {
  const files = getFilesRecursive(moduleRootDir).filter(
    (filePath) =>
      filePath.endsWith('.service.ts') ||
      filePath.endsWith('.service.js') ||
      filePath.endsWith('.repository.ts') ||
      filePath.endsWith('.repository.js'),
  );
  return loadExportedClasses(files, /(Service|Repository)$/);
}

export function autoRegisterControllers(moduleRootDir: string): ClassType[] {
  const files = getFilesRecursive(moduleRootDir).filter(
    (filePath) => filePath.endsWith('.controller.ts') || filePath.endsWith('.controller.js'),
  );
  return loadExportedClasses(files, /Controller$/);
}
