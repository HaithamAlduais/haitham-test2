import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPatch } from "../utils/apiClient";

/**
 * Ramsha — Custom hook for live session monitoring.
 *
 * Manages two polling loops for the Provider's Live Monitoring page:
 *   1. Attendance records — polled every 5 seconds while session is active
 *   2. Session status    — polled every 10 seconds to detect auto-close
 *
 * Computes derived stats (total, present, late) from the attendance array.
 * All polling stops when session status becomes "closed" or on unmount.
 *
 * @param {string} sessionId — The Firestore session document ID.
 * @returns {{
 *   session, attendance, stats, loading, error,
 *   activateSession, closeSession, refreshSession
 * }}
 */
export function useLiveAttendance(sessionId) {
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs to hold interval IDs for cleanup
  const attendanceIntervalRef = useRef(null);
  const sessionIntervalRef = useRef(null);
  // Track current status in a ref so interval callbacks see latest value
  const statusRef = useRef(null);

  /** Stop all polling intervals. */
  const stopPolling = useCallback(() => {
    if (attendanceIntervalRef.current) {
      clearInterval(attendanceIntervalRef.current);
      attendanceIntervalRef.current = null;
    }
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
      sessionIntervalRef.current = null;
    }
  }, []);

  /** Fetch session data from GET /api/sessions/:id. */
  const fetchSession = useCallback(async () => {
    try {
      const data = await apiGet(`/api/sessions/${sessionId}`);
      setSession(data);
      statusRef.current = data.status;

      // Stop polling when session is closed
      if (data.status === "closed") {
        stopPolling();
      }
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [sessionId, stopPolling]);

  /** Fetch attendance records from GET /api/attendance/:id/list. */
  const fetchAttendance = useCallback(async () => {
    // Skip if session is not active
    if (statusRef.current !== "active") return;

    try {
          const data = await apiGet(`/api/attendance/${sessionId}/list`);
      setAttendance(data.data ?? []);
    } catch {
      // Silently fail on attendance poll — will retry
    }
  }, [sessionId]);

  /** Initial load: fetch session + attendance, then start polling. */
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError(null);

      const sessionData = await fetchSession();
      if (cancelled) return;

      if (sessionData) {
        // Fetch initial attendance regardless of status (to show records
        // for already-closed sessions too)
        try {
      const data = await apiGet(`/api/attendance/${sessionId}/list`);
          if (!cancelled) setAttendance(data.data ?? []);
        } catch {
          // Non-critical
        }

        // Start polling only if session is active
        if (sessionData.status === "active" && !cancelled) {
          attendanceIntervalRef.current = setInterval(fetchAttendance, 5000);
          sessionIntervalRef.current = setInterval(fetchSession, 10000);
        }
      }

      if (!cancelled) setLoading(false);
    };

    init();

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [sessionId, fetchSession, fetchAttendance, stopPolling]);

  /**
   * Activate a draft session via PATCH /api/sessions/:id/activate.
   * For F2F sessions, the caller must provide instructorLocation.
   *
   * @param {Object} [body] — Optional body (e.g. { instructorLocation })
   */
  const activateSession = async (body = {}) => {
    const updated = await apiPatch(
      `/api/sessions/${sessionId}/activate`,
      body
    );
    setSession(updated);
    statusRef.current = updated.status;

    // Start polling now that it's active
    if (updated.status === "active") {
      attendanceIntervalRef.current = setInterval(fetchAttendance, 5000);
      sessionIntervalRef.current = setInterval(fetchSession, 10000);
    }

    return updated;
  };

  /**
   * Close an active session via PATCH /api/sessions/:id/close.
   */
  const closeSession = async () => {
    const updated = await apiPatch(`/api/sessions/${sessionId}/close`);
    setSession(updated);
    statusRef.current = updated.status;
    stopPolling();
    return updated;
  };

  // Compute derived stats from the attendance array
  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === "present").length,
    late: attendance.filter((a) => a.status === "late").length,
  };

  return {
    session,
    attendance,
    stats,
    loading,
    error,
    activateSession,
    closeSession,
    refreshSession: fetchSession,
  };
}
