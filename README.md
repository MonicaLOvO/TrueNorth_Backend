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
JWT_SECRET=replace_with_a_long_random_secret
AI_USE_MOCK=false
AI_CONNECTION_ENCRYPTION_KEY=replace_with_a_long_random_secret
```

### Auth (logged-in users)

Full contract for the frontend: **[docs/FRONTEND_API.md](docs/FRONTEND_API.md)**.

- **POST** `/auth/register` — `{ userName, password, email?, displayName? }` → `{ access_token, user }`
- **POST** `/auth/login` — `{ userName, password }` → same shape
- **GET** `/auth/me` — Bearer token → current user (`Id`, `UserName`, `Email`, `DisplayName`)
- **PATCH** `/auth/me` — Bearer token → partial profile update
- **PATCH** `/auth/password` — Bearer token → `{ currentPassword, newPassword }`

**Favorites** (`/favorites/*`) require Bearer token; `POST` body is only `{ exploreId }` (user comes from token).

**My chats:** `GET /chats/me` with Bearer token.

Passwords are **hashed** (bcrypt). Existing users from before hashing must **register again** or reset in DB.

Optional env: `JWT_EXPIRES_IN_SECONDS` (default **86400** = 1 day).

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

### Voice chat — `POST /decisions/chat/audio` (frontend)

Use this when the user speaks instead of typing. The backend transcribes the recording, then runs the **same chat pipeline** as `POST /decisions/chat`, so the response shape matches text chat **plus** the raw transcript.

**Authentication:** None. Guests can call this endpoint (no Bearer token).

**Request**

- **Method:** `POST`
- **URL:** `{baseUrl}/decisions/chat/audio` (e.g. `http://localhost:3000/decisions/chat/audio`)
- **Body:** `multipart/form-data` (not JSON)
- **Required field**
  - **`audio`** — type **File**: the recorded audio (e.g. `.webm`, `.m4a`, `.mp3`, `.wav`). Field name must be exactly `audio`.
- **Optional field**
  - **`messages`** — type **Text**: a **JSON string** of the prior conversation, same array shape as `POST /decisions/chat`:

    `[{ "role": "user" | "assistant" | "system", "content": "..." }, ...]`

    The server appends the transcribed speech as a new **user** message after this history. Omit or send `[]` for a single-turn “only this recording” request.

**Example (conceptual)**

- Postman / Insomnia: Body → form-data → row `audio` = File, row `messages` = Text (optional JSON string).
- Browser: `FormData`: `formData.append('audio', fileBlob, 'recording.webm')`; optionally `formData.append('messages', JSON.stringify(priorMessages))`.
- Do **not** set `Content-Type` manually when using `FormData` in the browser; the runtime sets the boundary.

**Success response — HTTP 200**

JSON object with three top-level fields:

| Field | Meaning |
| --- | --- |
| **`transcript`** | Text produced by speech-to-text from the uploaded `audio` file. |
| **`message`** | Assistant reply from the AI, as if the user had typed `transcript` in chat. |
| **`explores`** | Array of explore suggestions (same idea as `POST /decisions/chat`). Items may include `name`, `description`, `url`, `location`, `imageUrl`, etc. |

**Example response**

```json
{
  "transcript": "Hello? Can you hear me?",
  "message": "I'm here! I can hear you loud and clear. How are you feeling today?",
  "explores": [
    {
      "name": "Explore Result",
      "description": "…",
      "url": null,
      "location": null,
      "imageUrl": null
    }
  ]
}
```

**Errors**

- **`400`** — missing/empty `audio`, bad `messages` JSON, transcription failure, or invalid audio.
- **Limits** — max upload size **25 MB** per file (server-enforced).

**Backend note (ops only):** Speech-to-text uses **Deepgram** when `DEEPGRAM_API_KEY` is set in `.env`; otherwise (without mock mode) Whisper via an OpenAI key in the **AI connections** DB. `AI_USE_MOCK=true` still forces a fake transcript unless `DEEPGRAM_API_KEY` is set (Deepgram takes priority for STT).

---

### Copy for Microsoft Teams (voice API)

You can paste the block below into Teams when sharing with the team (e.g. with a Postman screenshot of a `200` response).

```
TrueNorth — voice / audio chat API (for frontend)

We can send a voice recording to the backend instead of plain text chat.

• Endpoint: POST {server}/decisions/chat/audio
• Body: multipart/form-data
• Required field: "audio" = the audio file (recording)
• Optional field: "messages" = JSON string of prior chat turns (same format as POST /decisions/chat), if you need context
• Auth: not required for this route

The JSON response has three parts:
1) transcript — what the user actually said (speech-to-text)
2) message — the assistant’s reply (same as text chat)
3) explores — suggested “cards” / follow-ups, same as text chat

I’m attaching a Postman example: 200 OK with sample transcript + message + explores so you can see the shape end-to-end.
```

## Current API Summary

- `POST /decisions/guided` -> one-shot explore suggestions from category + answers
- `POST /decisions/chat` -> chat reply + explore suggestions (JSON body; no auth required)
- `POST /decisions/chat/audio` -> multipart audio → transcript + chat reply + explore suggestions (no auth required)
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
- `OPENAI_API_KEY` - use real OpenAI provider (chat path; env fallback when no DB key)
- `DEEPGRAM_API_KEY` - speech-to-text for `POST /decisions/chat/audio` (takes priority for STT when set)
- `AI_USE_MOCK=true` - mock LLM; STT still uses Deepgram if `DEEPGRAM_API_KEY` is set

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
