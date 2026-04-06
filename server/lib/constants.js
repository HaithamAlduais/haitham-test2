/**
 * Ramsha — Shared backend constants.
 *
 * Single source of truth for enums used across controllers and jobs.
 */

const SESSION_STATUS = { DRAFT: "draft", ACTIVE: "active", CLOSED: "closed" };
const SESSION_TYPE = { QR_CODE: "qr_code", F2F: "f2f" };
const ATTENDANCE_STATUS = { PRESENT: "present", LATE: "late", ABSENT: "absent" };

const EVENT_TYPES = {
  OTHER: "other",
  WORKSHOP: "workshop",
  SEMINAR: "seminar",
  TRAINING: "training",
  CONFERENCE: "conference",
};

const ALLOWED_EVENT_TYPES = Object.values(EVENT_TYPES);

const EVENT_CODE_PREFIX = {
  [EVENT_TYPES.OTHER]: "EVT",
  [EVENT_TYPES.WORKSHOP]: "WRK",
  [EVENT_TYPES.SEMINAR]: "SEM",
  [EVENT_TYPES.TRAINING]: "TRN",
  [EVENT_TYPES.CONFERENCE]: "CNF",
};

module.exports = {
  SESSION_STATUS,
  SESSION_TYPE,
  ATTENDANCE_STATUS,
  EVENT_TYPES,
  ALLOWED_EVENT_TYPES,
  EVENT_CODE_PREFIX,
};
