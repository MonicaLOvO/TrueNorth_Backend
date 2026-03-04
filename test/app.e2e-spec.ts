import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

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

  it('/recommendations/test (GET) returns recommendation cards (A4)', () => {
    return request(app.getHttpServer())
      .get('/recommendations/test')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('recommendations');
        expect(Array.isArray(res.body.recommendations)).toBe(true);
        expect(res.body.recommendations.length).toBeGreaterThan(0);
        const card = res.body.recommendations[0];
        expect(card).toHaveProperty('title');
        expect(card).toHaveProperty('description');
      });
  });
});
