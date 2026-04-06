import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { apiGet } from "../utils/apiClient";
import { useSessions } from "../hooks/useSessions";
import SessionCard from "../components/sessions/SessionCard";
import SessionCardSkeleton from "../components/sessions/SessionCardSkeleton";
import NewSessionModal from "../components/sessions/NewSessionModal";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const SessionsPage = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const { sessions, loading, error, createSession } = useSessions(selectedEventId || null);

  const eventsById = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => map.set(ev.id, ev.name || ev.title || "Untitled Event"));
    return map;
  }, [events]);

  useEffect(() => {
    const fetchEvents = async () => {
      try { const data = await apiGet('/api/events'); setEvents(data.data ?? []); } catch { /* optional */ }
    };
    fetchEvents();
  }, []);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleCreateSession = async (data) => {
    try {
      await createSession(data);
      setModalOpen(false);
      showToast(t('sessionCreated'));
    } catch (err) { showToast(err.message || t('sessionCreateFailed'), "error"); throw err; }
  };

  return (
    <DashboardLayout activePath="/sessions">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-heading text-3xl font-black text-foreground">{t('sessionsTitle')}</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t('newSession')}
        </Button>
      </div>

      {/* Event filter */}
      {events.length > 0 && (
        <div className="mb-8">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
            {t('filterByEvent')}
          </label>
          <div className="flex items-center gap-3">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full sm:w-64 rounded-base border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-main"
            >
              <option value="">{t('allSessions')}</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name || ev.title}</option>
              ))}
            </select>
            {selectedEventId && (
              <Button variant="neutral" size="sm" onClick={() => setSelectedEventId("")}>
                {t('clearFilter')}
              </Button>
            )}
          </div>
          {selectedEventId && (
            <p className="text-xs text-main mt-1.5 font-bold">
              {t('showingSessionsFor')} {events.find((ev) => ev.id === selectedEventId)?.name || events.find((ev) => ev.id === selectedEventId)?.title}
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-base border-2 border-destructive bg-destructive/10 p-4 mb-8">
          <p className="text-sm text-destructive font-bold">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <SessionCardSkeleton key={i} />)}
        </div>
      )}

      {/* Sessions grid */}
      {!loading && sessions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              linkedEventName={session.eventId ? eventsById.get(session.eventId) : null}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && sessions.length === 0 && !error && (
        <div className="rounded-base border-2 border-border bg-secondary-background p-12 text-center shadow-shadow">
          <p className="font-heading text-xl font-black text-foreground mb-2">{t('noSessionsYet')}</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{t('noSessionsDescription')}</p>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> {t('newSession')}
          </Button>
        </div>
      )}

      {/* Modal */}
      <NewSessionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreateSession} events={events} />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 end-6 z-[60] rounded-base border-2 px-5 py-3 text-sm font-bold shadow-shadow ${toast.type === 'error' ? 'border-destructive bg-background text-destructive' : 'border-main bg-background text-foreground'}`}>
          {toast.message}
        </div>
      )}
    </DashboardLayout>
  );
};

export default SessionsPage;
