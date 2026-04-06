import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "../utils/apiClient";

/**
 * Custom hook for managing sessions in the Ramsha platform.
 *
 * Handles fetching the Provider's sessions list (with optional event filter)
 * and creating new sessions. All requests are authenticated with the
 * Provider's Firebase ID token.
 *
 * @param {string|null} eventId - Optional event ID to filter sessions by.
 * @returns {{ sessions, loading, error, createSession, refreshSessions }}
 */
export function useSessions(eventId = null) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** Fetch sessions from the API, optionally filtered by eventId. */
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const path = eventId
        ? `/api/sessions?eventId=${encodeURIComponent(eventId)}`
        : `/api/sessions`;

      const data = await apiGet(path);
      setSessions(data.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  /** Refetch sessions on mount and whenever the eventId filter changes. */
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  /**
   * Create a new session via POST /api/sessions and prepend it to the
   * local list so the Provider sees it instantly without a full refetch.
   *
   * @param {Object} sessionData - The session fields to send.
   * @returns {Object} The created session object from the API.
   */
  const createSession = async (sessionData) => {
    const created = await apiPost("/api/sessions", sessionData);
    setSessions((prev) => [created, ...prev]);
    return created;
  };

  return { sessions, loading, error, createSession, refreshSessions: fetchSessions };
}
