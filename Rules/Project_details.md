# Ramsha — Project Overview

Read this file first. It tells you what this project is and how everything connects.

---

## What is Ramsha

An all-in-one event management platform for event providers.
Supports: hackathons, seminars, workshops, training programs.
Providers can publish events publicly or keep them private.

Core capabilities:
- Event creation and publishing
- Participant registration
- Attendance tracking (QR code and face-to-face)
- Attendance statistics and analytics
- Post-event activities (certificates)

---

## Architecture

```
┌──────────────────────────────────────────────┐
│              FRONTEND (React + Vite)          │
│                                              │
│  pages/ → components/ → hooks/ → context/    │
│                                              │
│  Reads data via Express API (apiClient.js) │
│  Can also read Firestore directly (client   │
│  SDK v9) for real-time or lightweight reads  │
│  Writes go through Express API               │
└─────────────────┬────────────────────────────┘
                  │ HTTP REST
                  ▼
┌──────────────────────────────────────────────┐
│            BACKEND (Express.js)               │
│                                              │
│  routes/ → controllers/ → Firebase Admin SDK  │
│  middleware/    jobs/    utils/                │
│                                              │
│  Runs standalone (dev) or Cloud Functions     │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│            FIREBASE SERVICES                  │
│                                              │
│  Firestore ─── Auth ─── Hosting ─── Functions │
└──────────────────────────────────────────────┘
```

**Key detail:** Frontend currently fetches most data via the Express API (`apiClient.js`), but can also read Firestore directly via the client SDK for real-time listeners or lightweight queries. Backend handles writes and business logic via Admin SDK. These are two different SDKs — never mix them.

---

## Tech Stack

- **Frontend:** React (JSX) + Vite + Tailwind CSS
- **Backend:** Express.js (Node.js)
- **Database:** Firebase Firestore (NoSQL)
- **Auth:** Firebase Authentication
- **Hosting:** Firebase Hosting + Cloud Functions
- **Linting:** ESLint

---

## Project Structure

```
RAMSHA/
├── src/                        # Frontend
│   ├── assets/
│   ├── components/             # Reusable UI
│   ├── context/                # React Context providers
│   ├── hooks/                  # Custom hooks
│   ├── pages/                  # Route-level pages
│   ├── utils/                  # Frontend helpers (api.js, apiClient.js, formatDate.js)
│   ├── App.jsx                 # Root component + routing
│   ├── main.jsx                # Vite entry
│   ├── firebase.js             # Client SDK init
│   └── firestoreSchema.js      # Collections, enums, doc builders, queries
│
├── server/                     # Backend
│   ├── routes/                 # Endpoint definitions
│   ├── controllers/            # Request handlers
│   ├── middleware/              # Auth, validation
│   ├── jobs/                   # Scheduled tasks (autoClose)
│   ├── utils/                  # Server helpers
│   ├── tests/                  # Server tests
│   └── index.js                # App setup + Admin SDK init
│
├── functions/                  # Cloud Functions wrapper
├── scripts/                    # Build/deploy
├── public/                     # Static assets
└── dist/                       # Build output
```

---

## Firestore Data Model

### `sessions` — Attendance sessions created by Providers

```
ownerUid: string              → Provider's Firebase UID
title: string
sessionType: "qr_code" | "f2f"
status: "draft" | "active" | "closed"
eventId: string | null
notes: string
allowedLatenessMinutes: number (default: 15)
durationMinutes: number | null
autoCloseTime: timestamp | null
qrCode: string | null          → QR sessions only
radiusMeters: number | null     → F2F sessions only
instructorLocation: { latitude, longitude } | null
createdAt: timestamp
```

### `attendance_records` — One per participant per session

```
sessionId: string
participantUid: string
participantName: string
participantEmail: string
attendanceTime: timestamp
status: "present" | "late" | "absent"
participantLocation: { latitude, longitude } | null  → F2F only
```

### `users` — User profiles

```
role: "Provider" | "Participant"
```

### Relationships
- Provider → owns many sessions (`ownerUid`)
- Session → belongs to an event (`eventId`)
- Session → has many attendance records (`sessionId`)
- Participant → has many attendance records (`participantUid`)
- No duplicate attendance per session+participant pair

---

## Enums (use these exact values)

```
SESSION_STATUS:  "draft" | "active" | "closed"
SESSION_TYPE:    "qr_code" | "f2f"
ATTENDANCE:      "present" | "late" | "absent"
USER_ROLE:       "Provider" | "Participant"    ← PascalCase
```

---

## API Routes

All prefixed with `/api`.

| Prefix | Purpose |
|---|---|
| `/api/sessions` | Session CRUD |
| `/api/attendance` | Record and query attendance |
| `/api/events` | Event management |

Allowed methods: `GET`, `POST`, `PATCH`.

---

## Two SDKs — Don't Mix

| SDK | Where | Auth method | Security rules |
|---|---|---|---|
| Client SDK v9 | `src/` (frontend) | Logged-in user token | Enforced |
| Admin SDK | `server/` (backend) | `serviceAccountKey.json` | Bypassed |

- Frontend: `import { db } from "./firebase"`
- Backend: `admin.firestore()`

Never use client SDK in server code. Never use Admin SDK in frontend code.

---

## Existing Helpers (use them)

All in `src/firestoreSchema.js`:

- `COLLECTIONS.SESSIONS`, `COLLECTIONS.ATTENDANCE_RECORDS`, `COLLECTIONS.USERS` → collection names
- `buildSessionDoc()` → creates session documents
- `buildAttendanceDoc()` → creates attendance documents
- `sessionsForOwner()` → query sessions by provider
- `sessionsByEventAndStatus()` → query sessions by event and status
- `attendanceForSession()` → query attendance by session
- `hasExistingAttendance()` → duplicate check
- `sessionDocRef()`, `attendanceDocRef()` → document references

Never hardcode collection names or manually construct documents when a helper exists.