# Ramsha — Architecture & Codebase Reference

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.2.0 |
| Routing | React Router DOM | 7.13.1 |
| Build | Vite | 7.3.1 |
| Styling | Tailwind CSS | 3.4.19 |
| UI Library | shadcn/ui + Radix UI | latest |
| State | React Context API | — |
| Forms | React Hook Form + Zod | 7.61.1 |
| Charts | Recharts | 2.15.4 |
| Animations | Framer Motion | 11.0.0 |
| Icons | Lucide React | latest |
| Backend | Express.js | 5.2.1 |
| Database | Firebase Firestore | — |
| Auth | Firebase Authentication | — |
| Admin SDK | firebase-admin | 10.3.0 |
| File Storage | AWS S3 (Cloudflare R2) | — |
| Scheduling | node-cron | 4.2.1 |
| Cloud Functions | Firebase Functions | 6.3.0 |
| Testing | Vitest + Jest + Playwright | — |

---

## Architecture Overview

```
Browser ──► Vite Dev Server (port 5173) ──► React SPA
                  │
                  │ /api/* proxy
                  ▼
            Express Server (port 5001)
                  │
          ┌───────┼───────┐
          ▼       ▼       ▼
      Firestore  Auth    R2 (S3)
      (NoSQL)   (Firebase) (Files)
```

**Authentication flow**: Firebase Auth (email/password) → ID token → Express middleware verifies token → Firestore role lookup → route access granted.

**Deployment**: Express app is wrapped as a Firebase Cloud Function for production. Scheduled jobs (auto-close sessions) run as Firebase scheduled functions.

---

## Folder Structure

```
Ramsha-main/
├── index.html                    # Vite HTML entry point
├── package.json                  # Frontend dependencies & scripts
├── vite.config.js                # Vite config (proxy /api → localhost:5001)
├── tailwind.config.js            # Tailwind theme (neo-brutalist tokens)
├── postcss.config.js             # PostCSS (Tailwind plugin)
├── eslint.config.js              # ESLint config
├── jsconfig.json                 # Path alias: @ → src/
├── components.json               # shadcn/ui configuration
├── .env                          # Environment variables
├── firebase.json                 # Firebase hosting & functions config
├── .firebaserc                   # Firebase project alias
├── firestore.rules               # Firestore security rules
├── firestore.indexes.json        # Firestore composite indexes
├── merge_pkg.cjs                 # Build helper for package merging
│
├── public/
│   └── vite.svg                  # Favicon
│
├── scripts/
│   └── copy-server-to-functions.cjs  # Copies server → functions/ for deploy
│
├── functions/
│   ├── index.js                  # Firebase Cloud Function (wraps Express app)
│   └── package.json              # Functions dependencies
│
├── server/                       # Express backend
│   ├── index.js                  # App init, CORS, routes, Firebase Admin
│   ├── package.json              # Server dependencies
│   ├── .env                      # Server environment variables
│   │
│   ├── lib/
│   │   ├── firebase.js           # Centralized Firebase Admin SDK (lazy db/auth)
│   │   └── constants.js          # Enums: SESSION_STATUS, ATTENDANCE_STATUS, etc.
│   │
│   ├── middleware/
│   │   └── requireRole.js        # Auth + role enforcement middleware
│   │
│   ├── controllers/
│   │   ├── eventController.js    # Event CRUD operations
│   │   ├── sessionController.js  # Session CRUD + activate/close
│   │   ├── attendanceController.js # Check-in (QR + F2F) with transactions
│   │   ├── userController.js     # Profile CRUD + account deletion
│   │   └── uploadController.js   # R2 presigned URLs + file deletion
│   │
│   ├── routes/
│   │   ├── events.js             # POST/GET/PATCH /api/events
│   │   ├── sessions.js           # POST/GET/PATCH /api/sessions + activate/close
│   │   ├── attendance.js         # POST attend + GET list
│   │   ├── users.js              # GET/PATCH profile + DELETE account
│   │   └── upload.js             # POST presigned-url + POST delete-file
│   │
│   ├── jobs/
│   │   └── autoClose.js          # Cron: auto-close expired sessions (every min)
│   │
│   ├── utils/
│   │   └── haversine.js          # Great-circle distance for F2F proximity
│   │
│   └── tests/
│       ├── attendanceController.test.js
│       └── eventController.test.js
│
└── src/                          # React frontend
    ├── main.jsx                  # Entry: providers (Auth → Theme → Language → Router)
    ├── App.jsx                   # Router: 15 routes with role-based guards
    ├── firebase.js               # Firebase SDK init (Auth + Firestore)
    ├── index.css                 # Design system (tokens + neo-brutalist components)
    ├── translations.js           # i18n strings (English + Arabic)
    │
    ├── context/
    │   ├── AuthContext.jsx        # User session, role, email verification gate
    │   ├── ThemeContext.jsx       # Light/dark mode + landing audience state
    │   └── LanguageContext.jsx    # EN/AR + RTL direction + t() translator
    │
    ├── hooks/
    │   ├── useSessions.js         # Fetch provider's sessions list
    │   ├── useEventSessions.js    # Fetch sessions for a specific event
    │   ├── useLiveAttendance.js   # Live polling for attendance monitoring
    │   ├── useHomepageStats.js    # Dashboard stat counts
    │   ├── useAnimatedNumber.js   # Number counter animation
    │   └── useLandingHeaderScroll.js # Header dock/float + active section tracking
    │
    ├── utils/
    │   ├── apiClient.js           # HTTP client with Firebase token injection
    │   └── formatDate.js          # Firestore timestamp formatting
    │
    ├── lib/
    │   └── utils.js               # cn() — clsx + tailwind-merge
    │
    ├── pages/
    │   ├── Login.jsx              # Email/password login + signup tab
    │   ├── Signup.jsx             # Redirects to Login (signup is a tab)
    │   ├── EmailVerifiedPage.jsx  # Handles oobCode from verification email
    │   ├── VerifyEmailHoldingPage.jsx # Holding page while email sends
    │   ├── ResetPasswordPage.jsx  # Password reset via oobCode
    │   ├── ProviderHomePage.jsx   # Provider dashboard (stats, charts, quick actions)
    │   ├── ParticipantHomePage.jsx # Participant landing (coming soon)
    │   ├── EventsPage.jsx         # Event list with CRUD
    │   ├── CreateEventPage.jsx    # Event creation flow wrapper
    │   ├── EventDetailPage.jsx    # Event detail + linked sessions + materials
    │   ├── SessionsPage.jsx       # Session list with event filter
    │   ├── LiveMonitoringPage.jsx # Real-time session monitoring (5s polling)
    │   └── ProfileSettingsPage.jsx # Profile, password, account deletion
    │
    ├── components/
    │   ├── InteractiveGridPattern.jsx # Animated grid background (landing)
    │   │
    │   ├── layout/
    │   │   └── DashboardLayout.jsx    # Sidebar + header + mobile bottom nav
    │   │
    │   ├── auth/
    │   │   └── ResendVerificationButton.jsx # Resend email verification
    │   │
    │   ├── events/
    │   │   ├── EventCreationFlow.jsx  # 3-step event creation wizard
    │   │   ├── EventTypeStep.jsx      # Step 1: select type (hackathon coming soon)
    │   │   ├── GeneralEventForm.jsx   # Step 2: event details form
    │   │   ├── PublishDecisionStep.jsx # Step 3: publish or keep private
    │   │   ├── EventSuccessScreen.jsx # Post-creation confirmation
    │   │   ├── ProgressBar.jsx        # 3-step progress indicator
    │   │   └── PlaceholderSection.jsx # Placeholder for unbuilt types
    │   │
    │   ├── sessions/
    │   │   ├── NewSessionModal.jsx     # Create session modal
    │   │   ├── SessionCard.jsx        # Session display card
    │   │   ├── SessionCardSkeleton.jsx # Loading skeleton
    │   │   ├── SessionStatsBar.jsx    # Attendance stats bar
    │   │   ├── AttendeeList.jsx       # Attendee records list
    │   │   ├── QRDisplay.jsx          # QR code for check-in
    │   │   └── F2FInfoCard.jsx        # Face-to-face session info
    │   │
    │   ├── settings/
    │   │   ├── ProfileInfoSection.jsx  # Display name, email, role, date
    │   │   ├── ChangePasswordSection.jsx # Password change form
    │   │   └── DeleteAccountSection.jsx  # Account deletion with confirm
    │   │
    │   ├── materials/
    │   │   └── MaterialManager.jsx    # Upload/manage session materials
    │   │
    │   ├── stars/
    │   │   ├── s8.jsx                 # Star SVG (used by marquee)
    │   │   └── s28.jsx               # Star SVG (used by logo-marquee)
    │   │
    │   └── ui/                        # shadcn/ui component library
    │       ├── accordion.jsx
    │       ├── alert-dialog.jsx
    │       ├── button.jsx             # Neo-brutalist button with press effect
    │       ├── card.jsx               # Neo-brutalist card (2px border + shadow)
    │       ├── card-stack.jsx
    │       ├── carousel.jsx           # Embla-based carousel
    │       ├── chart.jsx              # Recharts wrapper
    │       ├── dropdown-menu.jsx
    │       ├── input.jsx
    │       ├── label.jsx
    │       ├── logo-marquee.jsx       # Infinite logo scroll
    │       ├── marquee.jsx            # Generic marquee
    │       ├── parallax-scrolling-text-effect.jsx
    │       ├── retro-grid.jsx
    │       └── sheet.jsx              # Side panel / drawer
    │
    └── landing/
        ├── LandingPage.jsx            # Main landing (participant view, light theme)
        ├── LandingOrganizerPage.jsx   # Organizer variant (dark theme)
        ├── LandingHeader.jsx          # Sticky header with theme/lang toggles
        ├── LandingIntro.jsx           # Hero section with animated stats
        ├── FeatureCarouselSection.jsx # Sticky-scroll feature cards
        ├── TrustedBrands.jsx          # Logo grid
        ├── LandingFAQ.jsx             # FAQ accordion
        ├── LandingContact.jsx         # CTA + footer
        └── landingLocale.js           # Landing-specific i18n (EN/AR)
```

---

## File Descriptions

### Root Configuration

| File | Purpose |
|------|---------|
| `package.json` | Frontend monorepo. Scripts: `dev` runs Vite + Express concurrently, `build` produces dist/, `lint` runs ESLint |
| `vite.config.js` | React plugin, `@` alias to `src/`, dev proxy `/api` → `http://localhost:5000` |
| `tailwind.config.js` | Dark mode via `class`, custom fonts (IBM Plex Serif), neo-shadow spacing, semantic color tokens from CSS variables, accordion/pulse animations |
| `components.json` | shadcn/ui: `base-nova` style, no RSC, no TSX, Lucide icons, neutral base color |
| `firebase.json` | Predeploy script copies server to functions. Emulators: functions on port 5000 |

### Frontend — Core (`src/`)

| File | Purpose |
|------|---------|
| `main.jsx` | Wraps app in `BrowserRouter` → `AuthProvider` → `ThemeProvider` → `LanguageProvider`. Imports `index.css` |
| `App.jsx` | 15 routes. `PrivateRoute` enforces auth + role. `DefaultRedirect` sends Providers to `/dashboard`, Participants to `/home`. Public routes: `/`, `/organizer`, `/login`, `/signup`, `/email-verified`, `/verify-email`, `/reset-password` |
| `firebase.js` | Initializes Firebase app from env vars (`VITE_FIREBASE_*`). Exports `db` (Firestore), `auth` (Auth), `actionCodeSettings` (email verification redirect URL) |
| `index.css` | **The design system file.** Contains all CSS variables for light/dark themes, neo-shadow system (RTL-aware), bold preset, typography (IBM Plex Serif/Arabic), grid pattern, and the full `.ru-*` neo-brutalist component library |
| `translations.js` | Object with `en` and `ar` keys. Covers all UI text: nav, forms, buttons, status labels, event types, error messages |

### Frontend — Context Providers

| File | Exports | State | Persistence |
|------|---------|-------|-------------|
| `AuthContext.jsx` | `AuthProvider`, `useAuth()` | `currentUser`, `userRole`, `loading` | Firebase Auth session |
| `ThemeContext.jsx` | `ThemeProvider`, `useTheme()` | `theme` (light/dark), `landingAudience` | `localStorage` (`ramsha-theme`) |
| `LanguageContext.jsx` | `LanguageProvider`, `useLanguage()` | `language` (en/ar), `isRTL`, `dir` | `localStorage` (`ramsha-lang`) |

### Frontend — Hooks

| Hook | Data Source | Polling | Purpose |
|------|------------|---------|---------|
| `useSessions(eventId?)` | `GET /api/sessions` | No | Fetch provider's session list, optional event filter |
| `useEventSessions(eventId)` | `GET /api/events/:id/sessions` | No | Fetch sessions linked to specific event |
| `useLiveAttendance(sessionId)` | `GET /api/attendance/:id`, `GET /api/sessions/:id` | 5s attendance, 10s session | Live monitoring with derived stats |
| `useHomepageStats()` | `GET /api/sessions`, `GET /api/events` | No | Active session count + total event count |
| `useAnimatedNumber(target, duration)` | — | — | Eased number counter animation |
| `useLandingHeaderScroll()` | — | — | Header dock/float state + active section via IntersectionObserver |

### Frontend — Utilities

| File | Exports | Purpose |
|------|---------|---------|
| `apiClient.js` | `apiGet`, `apiPost`, `apiPatch`, `apiDelete`, `ApiError` | HTTP client; auto-attaches Firebase ID token; reads `VITE_API_URL` for base |
| `formatDate.js` | `formatDate(value)`, `formatTime(value)` | Formats Firestore timestamps or ISO strings to locale date/time |
| `lib/utils.js` | `cn(...inputs)` | Merges Tailwind classes via `clsx` + `tailwind-merge` |

### Frontend — Pages

| Page | Route | Auth | Role | Purpose |
|------|-------|------|------|---------|
| `Login.jsx` | `/login`, `/signup` | Public | — | Email/password auth with signup tab, email verification |
| `EmailVerifiedPage.jsx` | `/email-verified` | Public | — | Consumes `oobCode` from Firebase verification email |
| `VerifyEmailHoldingPage.jsx` | `/verify-email` | Public | — | Waiting screen after verification email sent |
| `ResetPasswordPage.jsx` | `/reset-password` | Public | — | Password reset via `oobCode` |
| `ProviderHomePage.jsx` | `/dashboard` | Yes | Provider | Dashboard with stats chart, recent events, quick actions |
| `ParticipantHomePage.jsx` | `/home` | Yes | Participant | Placeholder (coming soon) |
| `EventsPage.jsx` | `/events` | Yes | Provider | Event list with create/edit/delete, `?new=true` opens creation |
| `CreateEventPage.jsx` | `/events/create` | Yes | Provider | Wrapper that auto-opens EventCreationFlow |
| `EventDetailPage.jsx` | `/events/:eventId` | Yes | Provider | Event info, linked sessions, materials manager |
| `SessionsPage.jsx` | `/sessions` | Yes | Provider | Session list filterable by event |
| `LiveMonitoringPage.jsx` | `/sessions/:id` | Yes | Provider | Real-time attendance monitoring with QR/F2F display |
| `ProfileSettingsPage.jsx` | `/settings` | Yes | Both | Profile info, password change, account deletion |

### Frontend — Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DashboardLayout` | `components/layout/` | Sidebar nav (desktop) + bottom nav (mobile) + header with theme/lang/logout |
| `EventCreationFlow` | `components/events/` | 3-step wizard: type → details → publish. Hackathon shows "Coming Soon" |
| `EventTypeStep` | `components/events/` | Grid of 6 event types. Hackathon disabled with toast |
| `GeneralEventForm` | `components/events/` | Form: name, description, speaker, date, duration, topic, location |
| `NewSessionModal` | `components/sessions/` | Create session: title, type (QR/F2F), date, duration, auto-close, location |
| `SessionCard` | `components/sessions/` | Card with status badge, type icon, date, attendee count |
| `AttendeeList` | `components/sessions/` | Table of attendees with name, email, status (present/late/absent), timestamp |
| `QRDisplay` | `components/sessions/` | Renders QR code containing session check-in URL |
| `F2FInfoCard` | `components/sessions/` | Shows lat/lng coordinates and allowed radius for F2F check-in |
| `MaterialManager` | `components/materials/` | Upload files to R2 via presigned URL, list/delete materials |
| `InteractiveGridPattern` | `components/` | Canvas-based grid with mouse proximity glow effect |
| `Button` | `components/ui/` | Neo-brutalist button with variants (default, ghost, nav, destructive), press animation |
| `Card` | `components/ui/` | `rounded-base border-2 border-border bg-secondary-background shadow-shadow` |

### Frontend — Landing Page

| Component | Purpose |
|-----------|---------|
| `LandingPage.jsx` | Entry: forces light theme, sets participant audience, renders all sections with `ReactLenis` smooth scroll |
| `LandingOrganizerPage.jsx` | Entry: forces dark theme, sets organizer audience |
| `LandingHeader.jsx` | Sticky header. Floats with `rounded-2xl` when scrolled, docks to top when past hero. Audience toggle switches between participant/organizer |
| `LandingIntro.jsx` | Hero: eyebrow badge, headline with accent spans, description, animated stats row, donut chart (event type distribution) |
| `FeatureCarouselSection.jsx` | 5 feature cards in a sticky-scroll stack. Each card has title, description, step badge with dynamic color |
| `TrustedBrands.jsx` | Logo grid with backdrop blur and hover lift |
| `LandingFAQ.jsx` | 6 FAQ items in accordion format |
| `LandingContact.jsx` | CTA section + contact cards (email, phone, address, hours) + footer with privacy/terms links |
| `landingLocale.js` | `getLandingCopy(lang)` returns all landing-specific strings for EN or AR |

---

## Backend — Server

### API Endpoints

| Method | Path | Auth | Role | Controller | Purpose |
|--------|------|------|------|-----------|---------|
| POST | `/api/events` | Yes | Provider | `createEvent` | Create new event |
| GET | `/api/events` | Yes | Provider | `listEvents` | List provider's events |
| GET | `/api/events/:eventId` | Yes | Provider | `getEvent` | Get single event |
| PATCH | `/api/events/:eventId` | Yes | Provider | `updateEvent` | Update event |
| GET | `/api/events/:eventId/sessions` | Yes | Provider | `listEventSessions` | List sessions in event |
| POST | `/api/sessions` | Yes | Provider | `createSession` | Create new session |
| GET | `/api/sessions` | Yes | Provider | `listSessions` | List provider's sessions |
| GET | `/api/sessions/:id` | Yes | Provider | `getSession` | Get single session |
| PATCH | `/api/sessions/:id` | Yes | Provider | `updateSession` | Update session |
| PATCH | `/api/sessions/:id/activate` | Yes | Provider | `activateSession` | Activate (draft → active) |
| PATCH | `/api/sessions/:id/close` | Yes | Provider | `closeSession` | Close (active → closed) |
| POST | `/api/attendance/:id/attend` | Yes | Both | `attendSession` | Check-in (QR or F2F) |
| GET | `/api/attendance/:id/list` | Yes | Provider | `listAttendance` | View attendance records |
| GET | `/api/users/profile` | Yes | Both | `getProfile` | Get user profile |
| PATCH | `/api/users/profile` | Yes | Both | `updateProfile` | Update profile |
| POST | `/api/users/delete-account` | Yes | Both | `deleteAccount` | Soft-delete + hard-delete auth |
| POST | `/api/upload/presigned-url` | Yes | Provider | `generatePresignedUrl` | Get R2 upload URL |
| POST | `/api/upload/delete-file` | Yes | Provider | `deleteFile` | Delete file from R2 |

### Server Files

| File | Purpose |
|------|---------|
| `index.js` | Express app. CORS config, JSON parsing, route mounting (`/api/events`, `/api/sessions`, `/api/attendance`, `/api/users`, `/api/upload`), Firebase Admin init, starts auto-close cron job |
| `lib/firebase.js` | Lazy-initialized `admin`, `db()`, `auth()`. Uses service account key for admin access |
| `lib/constants.js` | `SESSION_STATUS` (draft/active/closed), `SESSION_TYPE` (qr_code/f2f), `ATTENDANCE_STATUS` (present/late/absent), `EVENT_TYPES`, `EVENT_CODE_PREFIX` |
| `middleware/requireRole.js` | Verifies Firebase ID token, fetches user doc from Firestore, checks role against allowed roles. Attaches `req.uid`, `req.email`, `req.role` |
| `controllers/sessionController.js` | Session lifecycle: create (draft), activate (generates QR URL), close, update. Generates unique 6-char session codes |
| `controllers/eventController.js` | Event CRUD. Generates event codes (`EVT-XXXXXX`). Ownership verification on get/update |
| `controllers/attendanceController.js` | Transactional check-in prevents race-condition duplicates. QR mode: validates session code. F2F mode: validates geolocation within radius via haversine |
| `controllers/userController.js` | Profile get/update. Account deletion: soft-delete Firestore doc + hard-delete Firebase Auth user |
| `controllers/uploadController.js` | Generates presigned PUT URLs for Cloudflare R2 (S3-compatible). Deletes files by key |
| `jobs/autoClose.js` | `node-cron` job running every minute. Queries active sessions with expired `autoCloseTime`, closes them |
| `utils/haversine.js` | Calculates great-circle distance in meters between two `{lat, lng}` points |

---

## Design System (`src/index.css`)

### CSS Variable Tokens

**Light mode** (`--background: oklch(99.2%...)`, `--foreground: black`, `--main: indigo blue`)
**Dark mode** (`.dark` class: `--background: oklch(16%...)`, `--foreground: near-white`, `--main: lighter indigo`)

### Neo-Shadow System
RTL-aware via `--neo-dir-sign` (1 for LTR, -1 for RTL). Four sizes: `sm` (1px), default (2px), `lg` (3px), `xl` (4px). Bold preset doubles all magnitudes.

### Component Library (`.ru-*` classes)
Typography (h1-h3, text, eyebrow, lead), Layout (container, section, stack, topbar), Surfaces (card, surface, strip), Navigation (menubar, link, tabnav), Buttons (button, icon-button), Forms (label, input, textarea, select, fieldset), Pills & Badges, Accordion, Grid & Feature Cards, Tiles, Quote Cards, Footer, Table, Divider, Utilities.

---

## Firestore Data Model

```
users/{uid}
  ├── email: string
  ├── displayName: string
  ├── role: "Provider" | "Participant"
  ├── createdAt: timestamp
  └── updatedAt: timestamp

events/{eventId}
  ├── ownerUid: string
  ├── name: string
  ├── eventCode: "EVT-XXXXXX"
  ├── eventType: "seminar" | "workshop" | "training" | "conference" | "other"
  ├── description: string
  ├── visibility: "public" | "private"
  ├── createdAt: timestamp
  └── updatedAt: timestamp

sessions/{sessionId}
  ├── ownerUid: string
  ├── eventId: string (optional)
  ├── title: string
  ├── sessionCode: "XXXXXX"
  ├── sessionType: "qr_code" | "f2f"
  ├── status: "draft" | "active" | "closed"
  ├── startTime: timestamp
  ├── durationMinutes: number
  ├── autoCloseTime: timestamp (optional)
  ├── location: { lat, lng, radius } (f2f only)
  ├── qrUrl: string (generated on activation)
  ├── createdAt: timestamp
  └── updatedAt: timestamp

attendance_records/{recordId}
  ├── sessionId: string
  ├── userId: string
  ├── userEmail: string
  ├── userName: string
  ├── status: "present" | "late" | "absent"
  ├── method: "qr" | "f2f"
  ├── checkedInAt: timestamp
  └── location: { lat, lng } (f2f only)
```

---

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Starts Vite (frontend) + Express (backend) concurrently |
| `npm run dev:client` | Starts Vite only |
| `npm run dev:server` | Starts Express with `--watch` |
| `npm run build` | Production Vite build → `dist/` |
| `npm run lint` | ESLint check |
| `npm run preview` | Serve production build locally |
