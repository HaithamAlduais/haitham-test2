import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../utils/apiClient';

/**
 * Custom hook for Ramsha Provider Homepage.
 * Fetches total event count and active session count in parallel.
 * All requests include the Provider's Firebase Auth ID token.
 *
 * @returns {Object} { activeSessionCount, totalEventCount, loading, error, refetchActiveSessions }
 */
const useHomepageStats = () => {
  const [activeSessionCount, setActiveSessionCount] = useState('-');
  const [totalEventCount, setTotalEventCount] = useState('-');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch session and event counts in parallel
      const [sessionsData, eventsData] = await Promise.all([
        apiGet('/api/sessions').catch(() => null),
        apiGet('/api/events').catch(() => null),
      ]);

      if (sessionsData) {
        const sessions = sessionsData.data ?? [];
        const activeCount = sessions.filter(s => s.status === 'active').length;
        setActiveSessionCount(activeCount);
      }

      if (eventsData) {
        const events = eventsData.data ?? [];
        setTotalEventCount(events.length);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchActiveSessions = useCallback(async () => {
    try {
      const data = await apiGet('/api/sessions');
      const sessions = data.data ?? [];
      const activeCount = sessions.filter(s => s.status === 'active').length;
      setActiveSessionCount(activeCount);
    } catch (err) {
      console.error('Failed to refetch active sessions for Ramsha Provider', err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { activeSessionCount, totalEventCount, loading, error, refetchActiveSessions };
};

export default useHomepageStats;