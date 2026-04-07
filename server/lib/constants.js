/**
 * Ramsha — Shared backend constants.
 *
 * Single source of truth for enums used across controllers and jobs.
 */

// ── Roles ───────────────────────────────────────────────────────────────────
const ROLES = {
  ADMIN: "Admin",
  ORGANIZER: "Organizer",
  PARTICIPANT: "Participant",
  JUDGE: "Judge",
  SPONSOR: "Sponsor",
};

/** Map legacy role names to the new canonical role. */
const LEGACY_ROLE_MAP = { Provider: ROLES.ORGANIZER };

// ── Sessions ────────────────────────────────────────────────────────────────
const SESSION_STATUS = { DRAFT: "draft", ACTIVE: "active", CLOSED: "closed" };
const SESSION_TYPE = { QR_CODE: "qr_code", F2F: "f2f" };
const ATTENDANCE_STATUS = { PRESENT: "present", LATE: "late", ABSENT: "absent" };

// ── Events ──────────────────────────────────────────────────────────────────
const EVENT_TYPES = {
  OTHER: "other",
  WORKSHOP: "workshop",
  SEMINAR: "seminar",
  TRAINING: "training",
  CONFERENCE: "conference",
  HACKATHON: "hackathon",
};

const ALLOWED_EVENT_TYPES = Object.values(EVENT_TYPES);

const EVENT_CODE_PREFIX = {
  [EVENT_TYPES.OTHER]: "EVT",
  [EVENT_TYPES.WORKSHOP]: "WRK",
  [EVENT_TYPES.SEMINAR]: "SEM",
  [EVENT_TYPES.TRAINING]: "TRN",
  [EVENT_TYPES.CONFERENCE]: "CNF",
  [EVENT_TYPES.HACKATHON]: "HKT",
};

// ── Hackathons ──────────────────────────────────────────────────────────────
const HACKATHON_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ACTIVE: "active",
  JUDGING: "judging",
  COMPLETED: "completed",
  ARCHIVED: "archived",
};

const ALLOWED_HACKATHON_STATUSES = Object.values(HACKATHON_STATUS);

const REGISTRATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WAITLISTED: "waitlisted",
};

const TEAM_STATUS = {
  FORMING: "forming",
  COMPLETE: "complete",
  SUBMITTED: "submitted",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

const SUBMISSION_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  EVALUATED: "evaluated",
};

// ── Prizes ─────────────────────────────────────────────────────────────────
const PRIZE_CATEGORY = {
  OVERALL: "overall",
  PER_TRACK: "per_track",
  SPECIAL: "special",
  SPONSOR: "sponsor",
  POPULAR_CHOICE: "popular_choice",
};

const PRIZE_TYPE = {
  CASH: "cash",
  CREDITS: "credits",
  ACCESS: "access",
  BADGES: "badges",
  PHYSICAL: "physical",
};

const PRIZE_FULFILLMENT = {
  PENDING: "pending",
  VERIFIED: "verified",
  DELIVERED: "delivered",
};

// ── Team Roles ─────────────────────────────────────────────────────────────
const TEAM_ROLES = {
  CAPTAIN: "captain",
  PM: "pm",
  DEVELOPER: "developer",
  DESIGNER: "designer",
};

const JOIN_REQUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// ── Sponsor Tiers ──────────────────────────────────────────────────────────
const SPONSOR_TIER = {
  PLATINUM: "platinum",
  GOLD: "gold",
  SILVER: "silver",
  BRONZE: "bronze",
  PARTNER: "partner",
};

// ── Firestore collection names ──────────────────────────────────────────────
const COLLECTIONS = {
  USERS: "users",
  EVENTS: "events",
  SESSIONS: "sessions",
  ATTENDANCE_RECORDS: "attendance_records",
  HACKATHONS: "hackathons",
  REGISTRATIONS: "registrations",
  TEAMS: "teams",
  SUBMISSIONS: "submissions",
  SCORES: "scores",
};

module.exports = {
  ROLES,
  LEGACY_ROLE_MAP,
  SESSION_STATUS,
  SESSION_TYPE,
  ATTENDANCE_STATUS,
  EVENT_TYPES,
  ALLOWED_EVENT_TYPES,
  EVENT_CODE_PREFIX,
  HACKATHON_STATUS,
  ALLOWED_HACKATHON_STATUSES,
  REGISTRATION_STATUS,
  TEAM_STATUS,
  SUBMISSION_STATUS,
  PRIZE_CATEGORY,
  PRIZE_TYPE,
  PRIZE_FULFILLMENT,
  TEAM_ROLES,
  JOIN_REQUEST_STATUS,
  SPONSOR_TIER,
  COLLECTIONS,
};
