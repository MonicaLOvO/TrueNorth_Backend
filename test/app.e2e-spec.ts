import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

if (!process.env.JWT_SECRET?.trim()) {
  process.env.JWT_SECRET = 'e2e-test-jwt-secret-do-not-use-in-production-32';
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/ai/test (GET) returns AI reply (mock when no key)', () => {
    return request(app.getHttpServer())
      .get('/ai/test')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('reply');
        expect(typeof res.body.reply).toBe('string');
        expect(res.body.reply.length).toBeGreaterThan(0);
      });
  });

  it('/decisions/chat (POST) returns chat reply and explores without auth', () => {
    return request(app.getHttpServer())
      .post('/decisions/chat')
      .send({
        messages: [{ role: 'user', content: 'I want a cozy dinner plan.' }],
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('message');
        expect(typeof res.body.message).toBe('string');
        expect(res.body.message.length).toBeGreaterThan(0);
        expect(res.body).toHaveProperty('explores');
        expect(Array.isArray(res.body.explores)).toBe(true);
      });
  });
});

describe('Decisions chat audio (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.AI_USE_MOCK = 'true';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
    delete process.env.AI_USE_MOCK;
  });

  /**
   * With AI_USE_MOCK, Whisper is skipped and a fixed transcript is used, so no real audio file is required.
   * Route is public: no Bearer token.
   */
  it('/decisions/chat/audio (POST) returns transcript, message, and explores without auth', () => {
    return request(app.getHttpServer())
      .post('/decisions/chat/audio')
      .attach('audio', Buffer.from([0x1a]), 'placeholder.webm')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('transcript');
        expect(typeof res.body.transcript).toBe('string');
        expect(res.body.transcript).toContain('Mock voice message');
        expect(res.body).toHaveProperty('message');
        expect(typeof res.body.message).toBe('string');
        expect(res.body.message.length).toBeGreaterThan(0);
        expect(res.body).toHaveProperty('explores');
        expect(Array.isArray(res.body.explores)).toBe(true);
      });
  });
});
