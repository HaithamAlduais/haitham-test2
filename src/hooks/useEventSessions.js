import { useCallback, useRef, useState } from "react";
import { apiGet } from "../utils/apiClient";

/**
 * Ramsha — Custom hook for fetching sessions linked to a specific event.
 *
 * Calls GET /api/events/:eventId/sessions and caches the result so
 * re-opening the Sessions tab does not trigger a redundant fetch.
 *
 * @param {string} eventId — The event ID to fetch sessions for.
 * @returns {{ sessions, loading, error, fetchSessions, addSession }}
 */
export function useEventSessions(eventId) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track whether sessions have already been fetched for caching
  const hasFetched = useRef(false);

  /**
   * Fetch sessions for the event from the API.
   * Skips the request if data was already fetched (cached),
   * unless force is true.
   */
  const fetchSessions = useCallback(
    async (force = false) => {
      if (!eventId) return;
      if (hasFetched.current && !force) return;

      setLoading(true);
      setError(null);
      try {
        const data = await apiGet(
          `/api/events/${encodeURIComponent(eventId)}/sessions`
        );
        setSessions(data.data ?? []);
        hasFetched.current = true;
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [eventId]
  );

  /**
   * Prepend a newly created session to the local cached list
   * so the Provider sees it instantly without a full refetch.
   */
  const addSession = useCallback((session) => {
    setSessions((prev) => [session, ...prev]);
  }, []);

  return { sessions, loading, error, fetchSessions, addSession };
}
