# TrueNorth Backend

NestJS + TypeScript backend for the TrueNorth decision assistant.

## Frontend Developer Quick Start

If you are integrating frontend for the first time, follow this section only.

### 1) Install and run

```bash
npm install
```

Create `.env` from `.env.example`, then set your database values (`DATABASE_*`).

Minimum `.env` example:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password_here
DATABASE_NAME=truenorth
AI_USE_MOCK=false
AI_CONNECTION_ENCRYPTION_KEY=replace_with_a_long_random_secret
```

AI connection setup (pick one):
- Mock only (no external AI): set `AI_USE_MOCK=true`
- Cloud key from DB (recommended): keep `AI_USE_MOCK=false`, then call `POST /ai/connections` to add OpenAI/Gemini keys
- Local Ollama: add an `ollama` provider in `POST /ai/connections` (see Local AI section below)

Example add OpenAI key to DB:

```json
POST /ai/connections
{
  "name": "openai-main",
  "providerType": "openai",
  "apiKey": "sk-...",
  "priority": 1,
  "isSelected": true,
  "isEnabled": true
}
```

Run backend:

```bash
npm run dev
```

### 2) Check backend is alive

- `GET /` -> `Hello World!`
- `GET /health` -> health payload
- `GET /ai/test` -> AI reply (mock or real)

Base URL in local dev is usually `http://localhost:3000`.

### 3) Minimum data setup for guided flow

1. Create category: `POST /categories`
2. Create chat with that category: `POST /chats`
3. Use returned `chatId` for guided lifecycle endpoints

### 3.1) How to get `chatId` (exactly)

Create a chat first:

```json
POST /chats
{
  "categoryId": "<yourCategoryId>",
  "userId": null
}
```

You will get a response like:

```json
{
  "Id": "5f0f6a84-9ce7-4c9a-8af8-1f8b9f2c9d12",
  "UserId": null,
  "CategoryId": "a3e7f8aa-5c44-4d8f-8e49-0a9a7b4c1f02"
}
```

Use `Id` from that response as your `chatId` in:
- `POST /decisions/guided/start/:chatId`
- `POST /decisions/guided/next/:chatId`
- `POST /decisions/guided/skip/:chatId`
- `POST /decisions/guided/finalize/:chatId`

### 4) Guided lifecycle you should call

- `POST /decisions/guided/start/:chatId`
  - Starts guided flow
  - Returns first `question` with `options`
- `POST /decisions/guided/next/:chatId`
  - Send selected `optionId`
  - Returns next `question`
- `POST /decisions/guided/skip/:chatId`
  - Skip current question
  - Returns replacement `question`
- `POST /decisions/guided/finalize/:chatId`
  - Send final `answers` object
  - Returns `explores` and persists them

### 5) Simple request examples

Start:

```json
POST /decisions/guided/start/{{chatId}}
{}
```

Next:

```json
POST /decisions/guided/next/{{chatId}}
{
  "optionId": "<optionId>"
}
```

Finalize:

```json
POST /decisions/guided/finalize/{{chatId}}
{
  "answers": {
    "budget": "medium",
    "distance": "nearby"
  }
}
```

### 6) Clean guided data for one chat (hard delete)

If you want to restart guided flow for a chat, use this endpoint:

```json
DELETE /conversations/chat/{{chatId}}/hard-clean
```

This endpoint does hard delete (`DELETE FROM ...`) for only:
- `answers`
- `options`
- `questions`
- `conversations`

It does **not** delete:
- `chats`
- `explores`

Example response:

```json
{
  "chatId": "d541b353-651a-4782-81b2-12b09048ef7b",
  "deleted": {
    "answers": 0,
    "options": 4,
    "questions": 1,
    "conversations": 1
  }
}
```

Chat shortcut (non-lifecycle):

```json
POST /decisions/chat
{
  "messages": [
    { "role": "user", "content": "Help me pick dinner tonight" }
  ]
}
```

## Current API Summary

- `POST /decisions/guided` -> one-shot explore suggestions from category + answers
- `POST /decisions/chat` -> chat reply + explore suggestions
- `POST /decisions/guided/start/:chatId`
- `POST /decisions/guided/next/:chatId`
- `POST /decisions/guided/skip/:chatId`
- `POST /decisions/guided/finalize/:chatId`
- `DELETE /conversations/chat/:chatId/hard-clean` -> hard delete guided-tree data only

## Architecture Snapshot

- Workflow orchestration: `src/Application/decisions`
- Domain modules: `src/Modules/*` (`chat`, `question`, `explore`, `user`, `category`)
- AI provider layer: `src/ai` (mock by default, OpenAI when configured)
- Guided persistence: `Conversation`, `Question`, `Option`, `Answer`
- Final results: `Explore` (+ `Favorite` bridge)

## Scripts

- `npm run dev` - start dev server
- `npm run build` - compile project
- `npm run test` - run unit tests
- `npm run test:e2e` - run e2e tests

## Environment

Required: `DATABASE_*` vars in `.env`.

Optional AI vars:
- `OPENAI_API_KEY` - use real OpenAI provider
- `AI_USE_MOCK=true` - force mock provider

## Local AI (Ollama) Setup

Use this if you want local AI fallback (or fully local AI) without cloud quota issues.

### 1) Install and run Ollama

Install Ollama from [https://ollama.com/download](https://ollama.com/download), then start it.

Pull a model:

```bash
ollama pull llama3.2
```

Quick check:

```bash
ollama list
```

### 2) Add local provider to backend DB

Create an Ollama AI connection:

```json
POST /ai/connections
{
  "name": "local-ollama",
  "providerType": "ollama",
  "priority": 1000,
  "isSelected": true,
  "isEnabled": true,
  "endpointUrl": "http://127.0.0.1:11434",
  "modelName": "llama3.2"
}
```

Notes:
- `priority`: smaller number = higher priority (`1` is highest)
- `apiKey` is not required for `ollama`

### 3) Activate local provider (optional)

If you created multiple providers, switch active one:

1. `GET /ai/connections`
2. Copy the local provider `id`
3. `PATCH /ai/connections/:id/activate`

### 4) Verify local AI connection

- `GET /ai/test` should return a normal AI response
- `POST /decisions/chat` should return `message` + `explores`

If it fails:
- Confirm Ollama server is running on `http://127.0.0.1:11434`
- Confirm model exists (`ollama list`)
- Confirm `endpointUrl` and `modelName` in DB match Ollama

## Deployment

Deploy target is Render. Set the same env vars there and use `GET /health` for health checks.
