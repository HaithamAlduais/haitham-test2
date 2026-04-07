# Ramsha — Remaining Work & Next Steps

## What's Built (27 commits, 5 phases)

Everything below has been fully implemented with backend API + frontend UI:

- Auth system (email/password, Google OAuth, email verification, 5 roles)
- Unified event management (hackathon, workshop, seminar, training, conference)
- Type-specific creation wizards for all 6 event types
- Registration system with custom fields, approval workflow, bulk actions
- Team management (create, join by code, leave, captain controls)
- Submission system (draft → finalize workflow, deadline enforcement)
- Judging system (criteria-based scoring, weighted averages, leaderboard)
- AI screening agent (Claude API for application evaluation)
- Enhanced user profiles (skills, education, professional, social, completeness %)
- Unified explore page with type + status filters + search
- Public event detail pages with type-specific sections
- Participant dashboard (my events, teams, submissions)
- Organizer dashboard (registrations table, teams grid, bulk approve/reject)
- Analytics dashboard (Recharts: pie charts, bar charts, stat cards)
- Project gallery with ranked display and medal podium
- Winner announcement page (top 3 podium, full leaderboard)
- Workshop scheduling with RSVP
- Announcement system (platform/email/discord channels)
- CSV export (registrations, teams, submissions)
- Firestore security rules for all roles and collections
- Role-aware dashboard sidebar
- Bilingual (English/Arabic) + RTL + dark mode throughout

---

## What Remains

### Priority 1: Firebase Database Setup
- **Firestore indexes**: Create composite indexes for collectionGroup queries (registrations, teams, submissions, members across all events)
- **Seed test data**: Create sample events of each type with registrations, teams, and submissions for testing
- **Verify schema**: Ensure Firestore documents match the controller expectations
- **Status**: Waiting for Firebase MCP plugin to load (already enabled in settings, needs session restart)

### Priority 2: Missing Features from Original Plan

#### Discord Auto-Setup
- Auto-create Discord server/channels when teams are accepted
- Per-team private channels
- Bot for attendance tracking and announcements
- **Effort**: Medium (requires Discord Bot API token + discord.js)

#### Email Integration
- Automated emails: registration confirmation, acceptance, rejection, reminders
- Custom email templates (organizer writes, system sends)
- Pre-scheduled email campaigns
- **Options**: Resend, SendGrid, or Firebase Extensions
- **Effort**: Medium (need email provider API key)

#### Post-Event Survey System
- Survey builder for organizers (multiple question types)
- Auto-send survey after event completion
- Survey response collection and analytics
- **Effort**: Low-Medium

#### Sponsor/Recruiter Portal
- Separate dashboard for sponsors
- Browse verified participant profiles (with consent)
- Filter by skills, experience, hackathon participation
- Contact/message participants
- Export participant data per sponsor agreement
- **Effort**: Medium-High

#### QR Code Attendance for Events
- The existing QR session system works for attendance tracking
- Need to integrate it with the new event types (not just standalone sessions)
- Generate event-specific QR codes for check-in
- **Effort**: Low (reuse existing QR infrastructure)

#### Phone Auth (OTP)
- Firebase Phone Auth for Saudi users (important for KSA market)
- Add phone number verification during signup
- **Effort**: Low (Firebase Auth already configured)

### Priority 3: Polish & Production

#### Translations
- Many new pages have hardcoded English strings
- Need to add Arabic translations for all Phase 2-5 features
- Add translation keys to `src/translations.js` for: hackathon wizard steps, explore page, registration form, team formation, submission form, judge portal, analytics, winner page, participant dashboard
- **Effort**: Medium (mostly copy work)

#### Responsive Design Audit
- Test all new pages on mobile viewports
- Ensure wizard steps work well on small screens
- Test RTL layout on all new components
- **Effort**: Low-Medium

#### Loading States & Error Handling
- Add proper skeleton loaders to all pages (some already have them)
- Add retry buttons on API failures
- Add toast notifications for all actions (some pages missing)
- **Effort**: Low

#### Performance
- Code-split with React.lazy() for route-level splitting (bundle is 1.5MB)
- Add pagination to large lists (registrations, teams, submissions)
- Implement cursor-based pagination on backend
- **Effort**: Medium

#### Testing
- Unit tests for backend controllers
- Integration tests for API endpoints
- E2E tests with Playwright (already in devDependencies)
- **Effort**: High

### Priority 4: Nice-to-Have

#### Real-time Updates
- Firestore onSnapshot listeners for live dashboard updates
- Real-time team formation (see new members join instantly)
- Live submission count during hackathon
- **Effort**: Medium

#### Notification Center
- In-app notification bell with unread count
- Notification types: registration status change, team join, submission scored, announcement
- Push notifications (Firebase Cloud Messaging)
- **Effort**: Medium

#### Profile Badges & Gamification
- Badges for: first hackathon, winner, mentor, frequent participant
- Participation history timeline
- Public profile pages
- **Effort**: Medium

#### Certificate Generation
- Auto-generate participation certificates (PDF)
- Winner certificates with event branding
- Downloadable from participant dashboard
- **Effort**: Medium (need PDF generation library)

---

## Architecture Decisions Log

| Decision | Choice | Why |
|----------|--------|-----|
| Stack | React+Vite+Express+Firebase | Keep existing, no migration overhead |
| Role system | roles[] array + legacy role string | Backward compatible with existing users |
| Event architecture | Unified /api/events with type field | All event types through one API |
| Data storage | events collection (primary) + hackathons (mirror) | New unified + backward compat |
| Sub-routes | Nested under events (registrations, teams, etc.) | Clean URL structure |
| AI screening | Claude Sonnet via Anthropic SDK | Best reasoning for Arabic+English |
| CSV export | Server-side generation, direct download | No client-side library needed |
| Security rules | Role-based with subcollection granularity | Judge confidentiality enforced |

---

## File Counts

| Category | Files |
|----------|-------|
| Pages (src/pages/) | 19 |
| Components (src/components/) | 30+ |
| Backend routes (server/routes/) | 12 |
| Backend controllers (server/controllers/) | 9 |
| Backend services (server/services/) | 1 |
| Utilities | 4 |
| Config files | 6 |
