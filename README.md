# TrueNorth Backend

NestJS + TypeScript backend for **TrueNorth**, an AI-powered decision assistant (what to eat, wear, watch, where to go, what to pack, etc.). Uses TypeORM + PostgreSQL and an optional OpenAI (or mock) provider for AI.

---

## Progress (what’s done)

- **Config & env** – DB and app config from `.env`; validated at startup. See `.env.example`.
- **Health** – `GET /health` and `GET /ready` for liveness/readiness (e.g. Render).
- **AI module** – LLM behind an interface: **mock provider** by default (no API key = no cost), **OpenAI provider** when `OPENAI_API_KEY` is set. `AiService.generateCompletion(messages)` is the single entry point.
- **Test endpoint** – `GET /ai/test` returns one AI reply (mock or real) so you can confirm the pipeline.
- **Recommendations module (A4)** – `RecommendationCardDto` and `RecommendationsService.parseFromAI()` to turn AI output into recommendation cards. Test via `GET /recommendations/test`.
- **Decisions module** – Guided and chat flows: `POST /decisions/guided` (category + answers → recommendations), `POST /decisions/chat` (messages → AI reply + recommendations). Frontend can build UI against these.

**Next up:** CORS for frontend origin, optional structured AI output for richer cards.

---

## API for frontend (decisions)

Base URL: your backend (e.g. `http://localhost:3000`).

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/decisions/guided` | User picked a category and answered questions → returns recommendation cards. |
| POST | `/decisions/chat` | User sent chat messages → returns AI reply + recommendation cards. |

**Guided** – Request body: `{ "categoryId": "<uuid from GET /categories>", "answers": { "time": "dinner", "mood": "cozy", ... } }`.  
Response: `{ "recommendations": [{ "title", "description", "link?", "type?" }, ...] }`.

**Chat** – Request body: `{ "messages": [{ "role": "user" | "assistant", "content": "..." }] }`.  
Response: `{ "message": "<AI reply text>", "recommendations": [...] }`.

The frontend can start implementing the UI and call these endpoints. No auth required for MVP.

---

## After you pull (quick start)

Thanks for jumping in. To get running locally:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`.
   - Fill in your local DB settings (PostgreSQL). Leave `OPENAI_API_KEY` empty to use the mock (no cost).

3. **Run**
   ```bash
   npm run dev
   ```

4. **Quick check**
   - [http://localhost:3000](http://localhost:3000) → `Hello World!`
   - [http://localhost:3000/health](http://localhost:3000/health) → `{"status":"ok",...}`
   - [http://localhost:3000/ai/test](http://localhost:3000/ai/test) → `{"reply":"[Mock AI – no API called]..."}`
   - [http://localhost:3000/recommendations/test](http://localhost:3000/recommendations/test) → `{"recommendations":[{ "title", "description", "type" }]}`

5. **Tests (recommended before you commit)**
   ```bash
   npm run test:e2e
   npm run dev
   ```

If anything’s unclear or you want to change the structure, just ask. Have fun building.

---

## Project setup

```bash
npm install
cp .env.example .env   # then edit .env with your DB and optional OPENAI_API_KEY
```

## Scripts

| Command | Description |
|--------|-------------|
| `npm run start:dev` | Run in watch mode (development). |
| `npm run build` | Compile for production. |
| `npm run start:prod` | Run compiled app (node dist/main). |
| `npm run test` | Unit tests. |
| `npm run test:e2e` | E2E tests (hits `/`, `/ai/test`, `/recommendations/test`). |

## Environment

See `.env.example`. Required: `DATABASE_*`. Optional: `OPENAI_API_KEY` (if set and not `AI_USE_MOCK=true`, the app uses the real OpenAI API). `AI_USE_MOCK=true` forces the mock provider.

## Deployment

Backend is intended to run on **Render**. Set env vars in the Render dashboard (same keys as in `.env.example`). Use `GET /health` (and optionally `GET /ready`) for health checks.

---

## NestJS resources

- [NestJS Docs](https://docs.nestjs.com)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
