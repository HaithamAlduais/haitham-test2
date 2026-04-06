/**
 * Formats a date value into a human-readable string for the Ramsha platform.
 *
 * Accepts Firestore Timestamps (with _seconds), ISO strings, epoch
 * milliseconds, or native Date objects.
 *
 * @param {Object|string|number|Date} value - The date to format.
 * @returns {string} Formatted date, e.g. "Mar 8, 2026".
 */
export function formatDate(value) {
  if (!value) return "";

  let date;

  if (typeof value === "object" && value._seconds != null) {
    // Firestore Timestamp serialised via REST / Admin SDK
    date = new Date(value._seconds * 1000);
  } else {
    date = new Date(value);
  }

  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a date value into a time string for Ramsha attendance views.
 *
 * @param {Object|string|number|Date} value - The date/time to format.
 * @returns {string} Formatted time, e.g. "2:35 PM".
 */
export function formatTime(value) {
  if (!value) return "";

  let date;

  if (typeof value === "object" && value._seconds != null) {
    date = new Date(value._seconds * 1000);
  } else {
    date = new Date(value);
  }

  if (isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
