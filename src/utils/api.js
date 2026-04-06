import { auth } from "../firebase";
import * as apiClient from "./apiClient.js";
const { ApiError } = apiClient;

/**
 * Ramsha — Centralized API utility.
 *
 * Delegates to apiClient.js which handles:
 *   1. Firebase Auth tokens (force-refreshed on every request).
 *   2. Base URL from VITE_API_URL (empty → Vite proxy in dev).
 *   3. Consistent { code, message } error objects.
 */

/** Re-export ApiError so callers can instanceof-check. */
export { ApiError };

/** Get a fresh Bearer token from the currently signed-in Firebase user. */
export async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) throw new ApiError(401, "Not authenticated");
  return user.getIdToken(true);
}

/** Build standard Authorization headers (kept for direct fetch callers). */
export async function getAuthHeaders() {
  const token = await getAuthToken();
  return { Authorization: `Bearer ${token}` };
}

/** Authenticated GET request. */
export function apiGet(path) {
  return apiClient.apiGet(path);
}

/** Authenticated POST request. */
export function apiPost(path, body) {
  return apiClient.apiPost(path, body);
}

/** Authenticated PATCH request. */
export function apiPatch(path, body) {
  return apiClient.apiPatch(path, body);
}
