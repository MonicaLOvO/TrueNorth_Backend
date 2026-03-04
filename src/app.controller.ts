/**
 * =============================================================================
 * APP CONTROLLER – Root HTTP endpoints
 * =============================================================================
 *
 * Controllers handle incoming HTTP requests and return responses.
 * The @Controller() decorator with no argument means routes here are at the
 * root (e.g. GET /, GET /health). We'll add feature-specific controllers
 * later (e.g. DecisionsController at /decisions).
 *
 * Dependency injection: Nest injects AppService and ConfigService into the
 * constructor. We don't "new" them ourselves – Nest creates one instance
 * and reuses it (singleton).
 */

import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly config: ConfigService,
  ) {}

  /**
   * GET / – Simple welcome. Useful to confirm the server is running.
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * GET /health – Liveness probe.
   * Returns 200 if the process is running. Use this for Render health checks
   * and monitoring. No DB or external calls – just "is the app up?"
   */
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  /**
   * GET /ready – Readiness probe.
   * Returns 200 if the app is ready to accept traffic (config loaded, and
   * optionally DB reachable). For now we only check that config is present;
   * we can add a real DB ping later when we have DataSource injected.
   */
  @Get('ready')
  getReady() {
    return this.appService.getReady(this.config);
  }
}
