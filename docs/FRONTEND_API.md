# TrueNorth backend — frontend integration guide

Base URL (local): `http://localhost:3000` (or your deployed API URL).

CORS is enabled for `http://localhost:3000` and `http://localhost:3001`. Add your Vercel origin on the backend when you deploy.

---

## Authentication (JWT)

### Register

`POST /auth/register`

```json
{
  "userName": "alex",
  "password": "atLeast8Chars",
  "email": "optional@email.com",
  "displayName": "Optional display name"
}
```

**Response:** `{ "access_token": "<jwt>", "user": { "Id", "UserName", "Email", "DisplayName" } }`  
Password is never returned.

### Login

`POST /auth/login`

```json
{ "userName": "alex", "password": "atLeast8Chars" }
```

Same response shape as register.

### Current user

`GET /auth/me`  
Header: `Authorization: Bearer <access_token>`

### Update profile

`PATCH /auth/me`  
Header: `Authorization: Bearer <access_token>`

```json
{
  "userName": "newName",
  "email": "new@email.com",
  "displayName": "Alex"
}
```

All fields optional; send only what changes. Use `null` for `email` or `displayName` to clear (where allowed).

### Change password

`PATCH /auth/password`  
Header: `Authorization: Bearer <access_token>`

```json
{
  "currentPassword": "old",
  "newPassword": "atLeast8Chars"
}
```

**Response:** `{ "ok": true }`

### Token lifetime

Default **1 day** (`86400` seconds). Override with env `JWT_EXPIRES_IN_SECONDS`.

---

## Logged-in only: favorites

All `/favorites` routes require `Authorization: Bearer <access_token>`.  
The server **ignores** any `userId` in the body for create; it uses the token’s user.

| Method | Path | Body | Notes |
|--------|------|------|--------|
| GET | `/favorites` | — | Current user’s favorites |
| GET | `/favorites/user/:userId` | — | Only if `:userId` matches token |
| GET | `/favorites/:id` | — | One favorite; must belong to you |
| POST | `/favorites` | `{ "exploreId": "<uuid>" }` | Save explore as favorite |
| PATCH | `/favorites/:id` | `{ "exploreId": "<uuid>" }` | Update which explore is linked |
| DELETE | `/favorites/:id` | — | Remove favorite |

---

## Logged-in only: my chats

| Method | Path | Notes |
|--------|------|--------|
| GET | `/chats/me` | Chats for the current user (requires Bearer token) |

`GET /chats` still returns all chats (use mainly for dev/admin awareness). Prefer `/chats/me` in the app for real users.

Guest chat sessions: create with `POST /chats` and `userId` null or omit as your API allows.

---

## Decisions (guest-friendly)

These typically do **not** require auth unless you add guards later.

- **Guided (one-shot):** `POST /decisions/guided` — `{ "categoryId", "answers": { ... } }` — **HTTP 200**
- **Chat (free-form):** `POST /decisions/chat` — `{ "messages": [ { "role", "content" } ] }` — **HTTP 200**
- **Chat (voice / audio):** `POST /decisions/chat/audio` — `multipart/form-data`
  - Field **`audio`**: audio file (e.g. webm, mp3, m4a)
  - Optional field **`messages`**: JSON **string** of the same `messages` array as `POST /decisions/chat` (prior turns). The server transcribes `audio`, appends it as the latest user message, then runs the same chat pipeline.
  - Response JSON: `{ "transcript", "message", "explores" }` (same `message` / `explores` shape as text chat).
- **Guided lifecycle:** `POST /decisions/guided/start/:chatId`, `.../next/:chatId`, `.../skip/:chatId`, `.../finalize/:chatId`

See README for full product notes and AI connection setup.

---

## Environment (backend)

Required for auth:

- `JWT_SECRET` — long random string (never commit real values).

See root `.env.example` for all variables.

---

## Legacy users

Accounts created **before** password hashing: passwords in the DB were plain text — **login will fail** until the user **registers again** or passwords are reset manually.
