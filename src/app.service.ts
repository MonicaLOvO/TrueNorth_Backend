/**
 * =============================================================================
 * APP SERVICE – Root-level business logic
 * =============================================================================
 *
 * Services hold the actual logic; controllers just call them and return the
 * result. @Injectable() marks this class so Nest can inject it into
 * controllers (or other services). We keep health/ready logic here so the
 * controller stays thin and we can unit-test the service.
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Health check: app is alive. No dependencies checked.
   */
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness: app is ready to accept traffic. We check that database config
   * is present (config was validated at startup, so if we're running we have it).
   * Later we can add a real DB ping via TypeORM DataSource.
   */
  getReady(config: ConfigService): { status: string; checks: Record<string, boolean> } {
    const dbConfigured =
      !!config.get('database.host') &&
      !!config.get('database.name');

    return {
      status: dbConfigured ? 'ok' : 'degraded',
      checks: {
        databaseConfigured: dbConfigured,
      },
    };
  }
}
