# Ramsha Backend Rules

Use these rules for every backend task.

---

## 1) Project Structure (routes → controllers)

Keep the existing pattern. Don't invent new layers.

```
server/
├── routes/          → endpoint definitions + middleware attachment
├── controllers/     → request handling + business logic
├── middleware/       → auth, validation, shared guards
├── jobs/            → scheduled tasks (e.g. autoClose)
├── utils/           → shared helpers
├── tests/           → all server tests
└── index.js         → Express app setup + Firebase Admin init
```

- One route file per domain (`sessions.js`, `attendance.js`, `events.js`).
- One controller file per domain.
- No "god files". If a controller goes past ~200 lines, split by sub-feature.

---

## 2) Boundaries (don't mix responsibilities)

- **Routes**:
  - define endpoints
  - attach middleware (auth, validation)
  - call controller functions
  - nothing else
- **Controllers**:
  - validate input
  - execute business logic
  - call Firebase Admin SDK
  - return response
- **Middleware**:
  - auth verification
  - input sanitization
  - cross-cutting concerns only

Never put business logic in routes. Never put HTTP concepts (`req`, `res`) in utils.

---

## 3) Input Validation (mandatory)

- Validate everything at the controller level before touching Firestore.
- Reject bad input with clean error messages.
- Strip unknown fields from request bodies.
- Validate path params and query strings, not just bodies.

**[PLANNED]** Migrate manual if/else validation to a schema library (Zod recommended). Current controllers use inline checks — acceptable for now, but new endpoints should prefer Zod when added.

---

## 4) Auth + Ownership (mandatory)

- Every user-specific endpoint requires auth middleware.
- Never trust `userId` from the client body or params.
- Always derive identity from the verified Firebase token (`req.uid`).
- Double-check ownership in controller logic — don't rely on the client.
- The `requireRole` middleware sets: `req.uid`, `req.email`, `req.role`, `req.userRecord`.

```javascript
// Good — identity from verified token
const ownerUid = req.uid;

// Bad — trusting the client
const ownerUid = req.body.userId;
```

---

## 5) Firestore Usage

- Collection names: `"sessions"`, `"attendance_records"`, `"events"`, `"users"`. Use these exact strings.
- Use `admin.firestore.FieldValue.serverTimestamp()` for all time fields — never `new Date()` or `Date.now()`.
- Check for existing attendance before recording — no duplicates.
- Use **transactions** when correctness depends on current state.
- Use **batch writes** for writing multiple docs at once.
- Don't store large files in Firestore — use Firebase Storage and store metadata only.

Note: `firestoreSchema.js` is a **frontend-only** file (client SDK). Server controllers access Firestore directly via `admin.firestore()`.

---

## 6) API Consistency

Current response shapes used across endpoints:

```javascript
// Success — list endpoints
{ data: [...] }

// Success — single resource or create
{ id: "...", ...fields }

// Error
{ error: "Human-readable error message." }
```

Status codes:
- `200/201/204` → success
- `400` → validation failure
- `401` → unauthenticated
- `403` → unauthorized (wrong role/ownership)
- `404` → not found
- `409` → conflict (e.g. duplicate attendance)
- `429` → rate limit
- `500` → server error

Never return `200` for errors. Never leak raw Firebase errors to clients.

---

## 7) Pagination **[PLANNED]**

Currently list endpoints return all results (with a hardcoded `.limit(50)` on sessions). When collections grow, add:
- `limit` query param (default: 20, max: 50)
- `cursor` query param (Firestore `startAfter`)
- optional filters (`status`, `eventId`, `sessionType`)

Always order by an indexed field (`createdAt desc`).

---

## 8) Error Handling

- Every controller wraps its logic in try/catch and returns a safe error response.
- Log full errors internally with `console.error`.
- Return only safe, generic messages to the client.
- Never expose Firestore errors, file paths, or stack traces in responses.
- The `requireRole` middleware has its own top-level try/catch so it never hangs.

**[PLANNED]** Extract a global error handler middleware to reduce try/catch boilerplate in controllers.

---

## 9) CORS & HTTP Methods

Current allowed methods: `GET`, `POST`, `PATCH`, `OPTIONS`.
Current allowed origins are set in `.env` (`CORS_ORIGIN`).

- Don't change CORS config without discussion.
- Don't add `PUT` or `DELETE` without updating the CORS config first.
- In production, never use `*` as origin.

---

## 10) Secrets & Environment

- No secrets in code. Ever.
- Use `.env` for local development.
- Use `serviceAccountKey.json` for Firebase Admin — never commit it.
- Keep `.env.example` up to date with every required variable.
- Don't point dev clients at production Firestore.

---

## 11) Code Quality (non-negotiable)

### Readability
- Prefer boring code over clever code.
- If someone can't understand it in 60 seconds, simplify.
- Max 2 levels of nesting. Use early returns.

### Naming
- Name by intent: `createSession`, `verifyAttendance`, `closeExpiredSessions`.
- No generic names: `data`, `info`, `temp`, `helper`, `doThing`.
- Booleans: `isActive`, `hasAttendance`, `canClose`.
- Constants: `MAX_RETRY_COUNT`, `DEFAULT_LIMIT`.

### No dead code
- If it's not used, delete it.
- Remove unused imports, exports, and commented-out blocks.

### No duplication
- If you write the same logic twice, extract it to `server/utils/`.

### Variables
- `const` by default. `let` only when reassignment is needed. Never `var`.

---

## 12) Firebase SDK (critical)

The server uses **Firebase Admin SDK** (`firebase-admin`).

- Never import from the client SDK (`firebase/firestore`, `firebase/auth`) in server code.
- Admin SDK bypasses security rules — always validate and authorize in code.
- Use `admin.firestore()` for database access, not the client `db`.

---

## 13) Jobs & Background Tasks

- Scheduled tasks go in `server/jobs/`.
- **Local dev:** The `autoClose` job runs via `node-cron` on server start (`startAutoCloseJob()` in the `if (require.main === module)` block).
- **Production (Cloud Functions):** Auto-close runs as a Firebase Scheduled Function (`autoCloseExpiredSessions` in `functions/index.js`) — `node-cron` does not work in Cloud Functions.
- Jobs must handle errors gracefully — a failed job should not crash the server.
- Log job execution: start, success, and failure.

---

## 14) Tests (minimum standard)

- Unit test controllers for core flows.
- Every endpoint should have at minimum:
  - 1 happy path test
  - 1 validation/auth failure test
- Tests go in `server/tests/`.
- Mock Firebase Admin SDK in unit tests.
- Use Firebase Emulators for integration tests.
- Test names describe behavior: `should return 409 when attendance already exists`.