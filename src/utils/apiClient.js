import { auth } from "../firebase";

/**
 * Ramsha — Reusable API client.
 *
 * - Reads the base URL from VITE_API_URL (empty string → uses Vite proxy in dev).
 * - Attaches a fresh Firebase ID token (force-refreshed) to every request.
 * - Exposes get / post / patch / del helpers.
 * - Always throws a consistent { code, message } error object.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

/** ApiError — structured error that matches the server's { error } shape. */
export class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.message = message;
  }
}

/**
 * Get a fresh Firebase ID token.
 * Force-refreshes so expired tokens are never sent.
 */
async function freshToken() {
  const user = auth.currentUser;
  if (!user) throw new ApiError(401, "Not authenticated");
  return user.getIdToken(true);
}

/**
 * Internal fetch wrapper.
 * Attaches the Authorization header, parses JSON, and normalises errors.
 */
async function request(method, path, body) {
  const token = await freshToken();

  const headers = { Authorization: `Bearer ${token}` };
  const options = { method, headers };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch (err) {
    // Network-level failure (server unreachable, DNS, CORS preflight blocked)
    throw new ApiError(0, "Network error — is the server running?");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error || data.message || `Request failed (${res.status})`);
  }

  return res.json();
}

/** Authenticated GET request. */
export function apiGet(path) {
  return request("GET", path);
}

/** Authenticated POST request. */
export function apiPost(path, body) {
  return request("POST", path, body);
}

/** Authenticated PATCH request. */
export function apiPatch(path, body) {
  return request("PATCH", path, body);
}

/** Authenticated DELETE request. */
export function apiDelete(path) {
  return request("DELETE", path);
}
