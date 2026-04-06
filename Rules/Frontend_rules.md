# Ramsha Frontend Rules + Design System

Use these rules for every frontend task. This file covers both code standards and visual design.

---

## CRITICAL DESIGN RULES (Never Violate)

- NO rounded corners — `rounded-none` on all elements
- NO gradient fills — no `bg-gradient-*`, no `from-*`, no `to-*`
- NO blur or soft shadows — no `shadow-md`, no `backdrop-blur`
- NO decorative illustrations or icons
- NO animations except functional state transitions (`transition-colors duration-100`)
- NO italics — use `font-bold` for emphasis
- Teal and Amber must NEVER appear in the same component
- ALL hex values must come from the Ramsha palette — no `bg-white`, `bg-gray-50`, etc.
- ALL user-facing strings must use `t()` from `useLanguage()` — no hardcoded text.
- ALL structural colors must be theme-aware via `useTheme()` — no `bg-steel` without conditional.

---

## 1) Project Structure

```
src/
├── pages/              → one file per route
├── components/         → reusable UI (shared across pages)
├── hooks/              → custom React hooks
├── context/            → AuthContext, ThemeContext, LanguageContext
├── utils/              → pure helper functions (api.js, apiClient.js, formatDate.js)
├── assets/             → images, icons, static files
├── App.jsx             → root component + routing
├── main.jsx            → Vite entry point
├── firebase.js         → client SDK init
└── firestoreSchema.js  → collections, enums, doc builders, queries
```

- Pages in `pages/`. Components in `components/`. No exceptions.
- One component per file. File name matches component name.
- No file over ~200 lines. Split if longer.

---

## 2) Component Rules

- Functional components only. No class components.
- Destructure props in the function signature.
- Max 3-4 props before you question if the component does too much.
- Keep components pure when possible — same props = same output.

```jsx
// Good
function SessionCard({ title, status, onClose }) { ... }

// Bad
function SessionCard(props) { ... }
```

---

## 3) State Management

Use the simplest option that works:
1. `useState` — default for local state
2. Custom hooks (`src/hooks/`) — for reusable stateful logic
3. Context (`src/context/`) — for global state only (auth, theme, language)

Rules:
- Check existing hooks/contexts before creating new ones.
- Never use Context for state only 1-2 components need.
- Never prop-drill more than 2 levels — extract to context or hook.
- No Redux, Zustand, or other state libraries unless explicitly discussed.

---

## 4) Firestore (Client SDK v9)

- Always use **modular imports** — never compat syntax.
- Use helpers from `firestoreSchema.js` for collection names and queries where possible — avoid hardcoding collection name strings.
- Use `serverTimestamp()` for time fields — never `new Date()`.
- **Current pattern**: Most data reads go through the **Express API** (via `apiGet`). The frontend *can* also read Firestore directly using `firestoreSchema.js` queries for real-time listeners or lightweight reads. Writes always go through the **Express API**.
- Never import Firebase Admin SDK in frontend code.

```javascript
// Good — using firestoreSchema helper for direct Firestore read
import { sessionsForOwner, COLLECTIONS } from "./firestoreSchema";

// Good — using apiGet for data fetched via Express
import { apiGet } from '../utils/api';
const data = await apiGet('/api/sessions');
```

---

## 5) API Calls

- All calls go through `src/utils/apiClient.js` (or the `apiGet`/`apiPost`/`apiPatch` wrappers in `src/utils/api.js`).
- The apiClient automatically attaches a fresh Firebase Auth token to every request.
- Base URL is read from `VITE_API_URL` env var (empty string in dev — uses Vite proxy).
- Errors are thrown as `ApiError { code, message }` objects.

```javascript
import { apiGet, apiPost, apiPatch } from '../utils/api';

// GET
const data = await apiGet('/api/sessions');

// POST
const created = await apiPost('/api/sessions', { title, sessionType });

// PATCH
const updated = await apiPatch(`/api/sessions/${id}/activate`, body);
```

- Handle loading, success, and error states for every call. Never silently swallow errors.

---

## 6) Routing

- One page per route. Pages live in `src/pages/`.
- Route definitions live in `App.jsx`.
- Protect auth routes with a guard wrapper.
- Descriptive paths: `/events/:eventId/sessions`, not `/e/:id/s`.

---

## 7) Two Themes — "Control Room" (Dark) + "Bone" (Light)

The app supports both themes. `ThemeContext` stores the selection in localStorage and sets `data-theme` on `<html>`. Follow these color tokens:

| Token | Dark "Control Room" | Light "Bone" |
|---|---|---|
| Page Background | `#0A0A0A` Ink | `#FAFAF7` Bone |
| Surface | `#1C1F26` Slate | `#F3F1EC` Linen |
| Card / Panel | `#2E3440` Steel | `#EBE8E2` Parchment |
| Border | `#3A3F4B` Smoke | `#C8C3BB` Stone |
| Primary Text | `#F0EFE9` Ghost | `#1A1A1A` Charcoal |
| Secondary Text | `#A8B0BC` Mist | `#7A756F` Ash |
| Teal (accent) | `#00E5CC` | `#00E5CC` |
| Amber (accent) | `#FFB800` | `#FFB800` |
| Red (destructive) | `#FF3B30` | `#FF3B30` |

Teal, Amber, and Red are **identical in both themes** — system signal colors, never change.

### CSS Custom Properties

```css
[data-theme="dark"], :root {
  --bg-base:        #0A0A0A;
  --bg-surface:     #1C1F26;
  --bg-card:        #2E3440;
  --border:         #3A3F4B;
  --text-primary:   #F0EFE9;
  --text-secondary: #A8B0BC;
  --shadow-card:    3px 3px 0px #3A3F4B;
  --grid-color:     rgba(58, 63, 75, 0.25);

  --teal:  #00E5CC;
  --amber: #FFB800;
  --red:   #FF3B30;
}

[data-theme="light"] {
  --bg-base:        #FAFAF7;
  --bg-surface:     #F3F1EC;
  --bg-card:        #EBE8E2;
  --border:         #C8C3BB;
  --text-primary:   #1A1A1A;
  --text-secondary: #7A756F;
  --shadow-card:    3px 3px 0px #C8C3BB;
  --grid-color:     rgba(200, 195, 187, 0.3);
}
```

---

## 8) Background Grid Pattern

Every page has a subtle square grid pattern on the base background. This is set **once** at the root layout level.

### CSS Implementation

```css
/* Add to your global CSS (index.css) */
.bg-grid {
  background-image:
    linear-gradient(var(--grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

### Apply at Root Layout Only

```jsx
// RootLayout.jsx
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';

export function RootLayout({ children }) {
  const { isRTL } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`min-h-screen font-mono bg-grid ${
        isDark ? 'bg-ink text-ghost' : 'bg-bone text-charcoal'
      }`}
    >
      {children}
    </div>
  );
}
```

Rules:
- Grid is on the page background only — never on cards, panels, modals, or surfaces.
- Grid lines are 1px, spaced 24px apart.
- Grid opacity is low — barely visible. It adds texture, not noise.
- Surfaces (`bg-surface`, `bg-card`) are **solid** and sit on top of the grid cleanly.

---

## 9) Tailwind Config

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'ink':       '#0A0A0A',
      'slate':     '#1C1F26',
      'steel':     '#2E3440',
      'smoke':     '#3A3F4B',
      'ghost':     '#F0EFE9',
      'mist':      '#A8B0BC',

      'bone':      '#FAFAF7',
      'linen':     '#F3F1EC',
      'parchment': '#EBE8E2',
      'stone':     '#C8C3BB',
      'charcoal':  '#1A1A1A',
      'ash':       '#7A756F',

      'teal':  '#00E5CC',
      'amber': '#FFB800',
      'red':   '#FF3B30',
    },
    fontFamily: {
      display: ['"Arial Black"', 'Arial', 'sans-serif'],
      mono:    ['"Courier New"', 'Courier', 'monospace'],
    },
    boxShadow: {
      'teal':       '4px 4px 0px #00E5CC',
      'amber':      '4px 4px 0px #FFB800',
      'card-dark':  '3px 3px 0px #3A3F4B',
      'card-light': '3px 3px 0px #C8C3BB',
    },
    borderRadius: {
      DEFAULT: '0px',
    },
  },
}
```

---

## 10) Language System (EN + AR)

`LanguageContext` stores the selection in localStorage, sets `dir` and `lang` on `<html>`, and exposes `t()`. Follow these rules:

- Every visible string must exist in both English and Arabic — no exceptions.
- English is default. Arabic triggers RTL layout (`dir="rtl"`).
- Language setting lives in `LanguageContext`.
- Labels are ALL CAPS in English. Normal casing in Arabic.
- Never hardcode `text-left` or `text-right` on content — use `text-start` and `text-end`.

### Translation File

All strings in `translations.js`. Never hardcode display text in components.

```js
export const translations = {
  en: {
    dashboard: 'DASHBOARD',
    events: 'EVENTS',
    // ... all keys
  },
  ar: {
    dashboard: 'لوحة التحكم',
    events: 'الفعاليات',
    // ... all keys
  },
};
```

**Rule:** Adding a string in one language without the other is incomplete and must not be merged.

### Usage

```jsx
import { useLanguage } from './LanguageContext';

function AttendeeLabel() {
  const { t } = useLanguage();
  return <label className="font-mono font-bold text-xs uppercase tracking-[0.12em]">{t('attendeeName')}</label>;
}
```

---

## 11) Theme-Aware Component Patterns

All components must use `useTheme()` for structural colors. Signal colors (teal, amber, red) are used directly.

### Page Layout

```jsx
const isDark = useTheme().theme === 'dark';

<div className={`min-h-screen font-mono bg-grid ${isDark ? 'bg-ink text-ghost' : 'bg-bone text-charcoal'}`}>
  <nav className={`border-b px-12 py-4 ${isDark ? 'bg-ink border-smoke' : 'bg-bone border-stone'}`} />
  <div className="flex">
    <aside className={`border-r px-6 py-8 ${isDark ? 'bg-slate border-smoke' : 'bg-linen border-stone'}`} />
    <main className="flex-1 px-12 py-12">
      <section className={`p-6 mb-12 ${isDark ? 'bg-slate' : 'bg-linen'}`}>
        <div
          className={`border p-4 ${isDark ? 'bg-steel border-smoke' : 'bg-parchment border-stone'}`}
          style={{ boxShadow: isDark ? '3px 3px 0px #3A3F4B' : '3px 3px 0px #C8C3BB' }}
        />
      </section>
    </main>
  </div>
</div>
```

### Buttons

```jsx
// Primary — Teal (both themes)
<button className="bg-teal text-ink font-display font-black text-sm tracking-widest uppercase
  border-[3px] border-ink px-4 py-2 rounded-none hover:shadow-teal transition-shadow duration-100">
  {t('confirm')}
</button>

// Secondary — theme-aware
<button className={`font-mono text-sm border-[3px] px-4 py-2 rounded-none
  hover:border-teal transition-colors duration-100
  ${isDark ? 'bg-steel text-ghost border-smoke' : 'bg-parchment text-charcoal border-stone'}`}>
  {t('cancel')}
</button>

// Destructive — Red (both themes)
<button className="bg-red text-ghost font-mono text-sm border-[3px] border-ink px-4 py-2 rounded-none">
  {t('delete')}
</button>

// Disabled — theme-aware
<button disabled className={`font-mono text-sm border-[3px] px-4 py-2 rounded-none cursor-not-allowed
  ${isDark ? 'bg-smoke text-mist border-smoke' : 'bg-stone text-ash border-stone'}`}>
  ...
</button>
```

### Form Inputs

```jsx
<input className={`w-full border-2 font-mono text-sm px-4 py-2 rounded-none
  focus:outline-none focus:border-teal
  ${isDark
    ? 'bg-steel border-smoke text-ghost placeholder:text-mist'
    : 'bg-parchment border-stone text-charcoal placeholder:text-ash'
  }`}
  placeholder={t('enterValue')}
/>
```

### Status Indicators

```jsx
// Active — teal stripe
<div className={`border-l-4 border-teal pl-4 py-2 ${isDark ? 'bg-steel' : 'bg-parchment'}`}>
  <span className={`font-mono ${isDark ? 'text-ghost' : 'text-charcoal'}`}>{name}</span>
</div>

// Pending — amber (never alongside teal in same component)
<span className="border border-amber text-amber font-mono text-xs tracking-widest uppercase px-2 py-0.5">
  {t('pending')}
</span>

// Confirmed — teal
<span className="bg-teal text-ink font-mono text-xs tracking-widest uppercase px-2 py-0.5">
  ✓ {t('confirmed')}
</span>

// Error
<p className="text-red font-mono text-xs mt-1">{errorMessage}</p>
```

### Data Tables

```jsx
<table className="w-full border-collapse font-mono text-sm tabular-nums">
  <thead>
    <tr className={`border-b ${isDark ? 'border-smoke' : 'border-stone'}`}>
      <th className={`text-start tracking-[0.12em] uppercase text-xs py-3 px-4
        ${isDark ? 'text-mist' : 'text-ash'}`}>
        {t('columnName')}
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className={`border-b transition-colors
      ${isDark ? 'border-smoke hover:bg-steel' : 'border-stone hover:bg-parchment'}`}>
      <td className={`py-3 px-4 ${isDark ? 'text-ghost' : 'text-charcoal'}`}>Value</td>
    </tr>
  </tbody>
</table>
```

---

## 12) Typography

Font families and sizes are identical across themes — only text color swaps.

| Role | Font | Weight | Class |
|---|---|---|---|
| Display / Hero | Arial Black | 900 | `font-display font-black text-6xl leading-[1.1]` |
| Heading H1 | Arial Black | 900 | `font-display font-black text-4xl leading-[1.1]` |
| Heading H2 | Arial Black | 700 | `font-display font-bold text-3xl leading-[1.1]` |
| Body | Courier New | 400 | `font-mono text-sm leading-[1.65] max-w-[72ch]` |
| Label / Tag | Courier New | 700 | `font-mono font-bold text-xs uppercase tracking-[0.12em]` |
| Code / ID | Courier New | 700 | `font-mono font-bold text-xs text-amber` |

Rules:
- Labels: ALL CAPS + `tracking-[0.12em]` always.
- Body: max-width `72ch`.
- Never use `italic`. Bold for emphasis.
- Certificate IDs: always `text-amber`, regardless of theme.

---

## 13) Spacing Grid

Base unit: **4px**. All spacing must be multiples of 4.

| Context | Value | Tailwind |
|---|---|---|
| Component internal | 16px | `p-4` |
| Between components | 24px | `gap-6` |
| Section gaps | 48px | `gap-12` |
| Page margin (mobile) | 24px | `px-6` |
| Page margin (desktop) | 48px | `px-12` |

---

## 14) Responsive Breakpoints

Follow mobile-first. These are the only breakpoints:

| Name | Width | Usage |
|---|---|---|
| Default | 0px+ | Mobile — single column, `px-6` |
| `md` | 768px+ | Tablet — sidebar appears, 2-col layouts |
| `lg` | 1024px+ | Desktop — full layout, `px-12` |

Rules:
- Sidebar collapses to a hamburger/drawer below `md`.
- Tables scroll horizontally below `md` — never break their layout.
- Cards stack single-column below `md`, grid above.
- Never use `sm`, `xl`, `2xl` — keep the breakpoint count minimal.

---

## 15) Z-Index Scale

Use these exact values. No arbitrary z-index numbers.

| Layer | Value | Usage |
|---|---|---|
| Base content | `z-0` | Default page content |
| Sticky header | `z-10` | Nav bar, sticky table headers |
| Dropdown | `z-20` | Menus, selects, popovers |
| Sidebar overlay | `z-30` | Mobile sidebar drawer |
| Modal backdrop | `z-40` | Overlay behind modal |
| Modal content | `z-50` | Modal itself |
| Toast / Notification | `z-[60]` | Always on top |

Never use `z-[999]` or any random value. If something needs to be above everything, it's a toast at `z-[60]`.

---

## 16) Loading & Empty States

Every data-fetching component must handle three states:

```jsx
if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorState message={error} onRetry={refetch} />;
if (items.length === 0) return <EmptyState message={t('noSessionsYet')} />;
```

### Skeleton Pattern

Skeletons use the surface color with a subtle pulse — the only permitted animation.

```jsx
// Theme-aware skeleton block
<div className={`animate-pulse rounded-none h-4 w-3/4 ${isDark ? 'bg-smoke' : 'bg-stone'}`} />
```

Rules:
- Skeletons mimic the shape of real content (same height, same layout).
- Never show a blank screen. Never show raw error objects.
- Error states include a retry action.
- Empty states include a message and a CTA when appropriate.

---

## 17) Modals & Overlays

```jsx
// Backdrop — fixed, covers viewport
<div className="fixed inset-0 z-40 bg-ink/70" onClick={onClose} />

// Modal panel — centered, theme-aware
<div className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
  w-full max-w-lg border-2 p-6
  ${isDark ? 'bg-slate border-smoke' : 'bg-linen border-stone'}`}
  style={{ boxShadow: isDark ? '6px 6px 0px #3A3F4B' : '6px 6px 0px #C8C3BB' }}
>
  {children}
</div>
```

Rules:
- Backdrop is always `bg-ink/70` (dark overlay in both themes).
- Modal shadow is larger than card shadow (6px vs 3px).
- Close on backdrop click and Escape key.
- Trap focus inside the modal when open.

---

## 18) Toasts & Notifications

```jsx
// Toast container — fixed bottom-right (flips in RTL)
<div className="fixed bottom-6 end-6 z-[60] flex flex-col gap-3">
  {/* Success toast */}
  <div className={`border-l-4 border-teal px-4 py-3 font-mono text-sm
    ${isDark ? 'bg-steel text-ghost' : 'bg-parchment text-charcoal'}`}>
    {message}
  </div>

  {/* Error toast */}
  <div className={`border-l-4 border-red px-4 py-3 font-mono text-sm
    ${isDark ? 'bg-steel text-ghost' : 'bg-parchment text-charcoal'}`}>
    {message}
  </div>
</div>
```

Rules:
- Toasts auto-dismiss after 5 seconds.
- Use `end-6` not `right-6` — respects RTL.
- Max 3 toasts visible at once. Oldest dismissed first.
- No toast animations — they appear and disappear instantly.

---

## 19) Forms

- Controlled inputs only (`value` + `onChange`).
- Validate before submission — don't rely only on backend.
- Disable submit button during submission.
- Show inline errors next to the relevant field in `text-red`.
- Clear form or redirect after success.

---

## 20) Data Visualization

```jsx
<div className={`p-4 ${isDark ? 'bg-slate' : 'bg-linen'}`}>
  // Registration curve:  stroke="#00E5CC"    (both themes)
  // Attendance bars:     fill="#00E5CC"      (both themes)
  // Unfilled bars:       isDark ? "#3A3F4B" : "#C8C3BB"
  // Certificates issued: fill="#FFB800"      (both themes)
  // Cancellations:       fill="#FF3B30"      (both themes)
</div>
```

Chart containers use surface backgrounds. Data colors are fixed across themes.

---

## 21) Naming

### Files
- Components: `PascalCase.jsx` → `SessionCard.jsx`
- Hooks: `camelCase.js` → `useAuth.js`, `useSessions.js`
- Utils: `camelCase.js` → `formatDate.js`
- Pages: `PascalCase.jsx` → `Dashboard.jsx`

### Variables
- Components: `PascalCase`
- Functions: `camelCase`, verb-first → `fetchSessions`, `handleClose`
- Booleans: `is`, `has`, `can`, `should` → `isLoading`, `hasAttendance`
- Event handlers: `handle` prefix → `handleSubmit`
- Constants: `UPPER_SNAKE_CASE` → `MAX_FILE_SIZE`

No generic names: `data`, `info`, `temp`, `stuff`.

---

## 22) Code Quality (non-negotiable)

- Prefer boring code over clever code.
- Max 2 levels of JSX nesting — extract deeper blocks into components.
- Max ~200 lines per file.
- `const` by default. `let` only when needed. Never `var`.
- Delete unused code — components, imports, variables, commented blocks.
- If the same UI or logic appears twice, extract it.
- Don't add npm packages without justification.

---

## 23) Accessibility (minimum standard)

- All images need `alt` text.
- All interactive elements keyboard-accessible.
- Semantic HTML: `<button>` for actions, `<a>` for navigation.
- No `<div onClick>` when `<button>` is correct.
- Form inputs need `<label>` elements.
- Focus states must be visible — use `focus:border-teal` or `focus:outline-teal`.

---

## 24) Performance

- Lazy-load pages with `React.lazy()` if the bundle grows.
- `useMemo` for expensive computations — not everything.
- Clean up subscriptions in `useEffect` return functions.
- Don't fetch data in components that don't need it.
- Images: use WebP, set explicit `width`/`height`, lazy-load below the fold.

---

## FORBIDDEN — Never Generate

```jsx
className="rounded-md"              // No rounded corners
className="rounded-lg"              // No rounded corners
className="rounded-full"            // No rounded corners
className="bg-gradient-to-r ..."    // No gradients
className="shadow-md"               // No soft shadows
className="shadow-lg"               // No soft shadows
className="backdrop-blur"           // No blur
className="italic"                  // No italics
className="bg-white"                // Not in palette
className="bg-gray-50"              // Not in palette
className="text-left"               // Use text-start
className="text-right"              // Use text-end
style={{ color: '#00E5CC' }}        // Use className="text-teal"
<button>CONFIRM</button>            // Use t('confirm')
z-index: 999                        // Use the z-index scale
```

---

*Ramsha Design System · Control Room (Dark) + Bone (Light) · EN + AR · v1.2 · 2026*