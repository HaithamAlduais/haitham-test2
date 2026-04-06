import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { apiGet, apiPost } from "../utils/api";
import { useEventSessions } from "../hooks/useEventSessions";
import SessionCard from "../components/sessions/SessionCard";
import SessionCardSkeleton from "../components/sessions/SessionCardSkeleton";
import NewSessionModal from "../components/sessions/NewSessionModal";
import MaterialManager from "../components/materials/MaterialManager";
import { formatDate } from "../utils/formatDate";

/**
 * Ramsha — EventDetailPage
 *
 * Provider-only page showing event details and linked sessions.
 * Features a tab bar with "Details" and "Sessions" tabs.
 * Accessed via /events/:eventId (React Router).
 */
const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userRole, logout } = useAuth();
  const { t } = useLanguage();

  // Active tab
  const [activeTab, setActiveTab] = useState("details");

  // Event data
  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState(null);

  // Sessions tab — uses cached hook
  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    fetchSessions,
    addSession,
  } = useEventSessions(eventId);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  /** Fetch the event details on mount. */
  useEffect(() => {
    const fetchEvent = async () => {
      setEventLoading(true);
      setEventError(null);
      try {
        const data = await apiGet(
          `/api/events/${encodeURIComponent(eventId)}`
        );
        // Backend getEvent returns { id, ...eventFields } at the top level
        setEvent(data);
      } catch (err) {
        setEventError(err.message);
      } finally {
        setEventLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  /** Fetch sessions when the Sessions tab is first opened. */
  useEffect(() => {
    if (activeTab === "sessions") {
      fetchSessions();
    }
  }, [activeTab, fetchSessions]);

  /** Show a temporary toast notification. */
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /** Handle new session creation (pre-linked to this event). */
  const handleCreateSession = async (data) => {
    try {
      const created = await apiPost("/api/sessions", { ...data, eventId });
      addSession(created);
      setModalOpen(false);
      showToast(t('sessionLinkedCreated'));
    } catch (err) {
      showToast(err.message || t('sessionCreateFailed'), "error");
      throw err;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const tabs = [
    { key: "details", label: t('detailsTab') },
    { key: "sessions", label: t('sessionsTab') },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background bg-grid">
      {/* ───── Navbar ───── */}
      <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center justify-between px-6 md:px-12 sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-foreground text-background font-heading font-black text-sm flex items-center justify-center">
            R
          </div>
          <span className="font-heading font-black text-foreground">Ramsha</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline font-mono text-sm text-muted-foreground">
            {currentUser?.email}
          </span>
          <span className="border border-main text-main font-mono font-bold text-xs uppercase tracking-[0.12em] px-2 py-0.5">
            {userRole ?? "..."}
          </span>
          <button
            onClick={handleLogout}
            className="font-mono font-bold text-xs uppercase tracking-[0.08em] border-2 border-destructive text-destructive px-3 py-1.5 hover:bg-destructive hover:text-background transition-colors duration-100"
          >
            {t('logOut')}
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ───── Sidebar ───── */}
        <aside className="hidden md:block w-60 border-r-2 border-border bg-secondary-background py-6 shrink-0">
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 px-6 py-3 font-mono text-sm text-muted-foreground hover:bg-card transition-colors duration-100 text-start"
            >
              <span>{t('dashboard')}</span>
            </button>
            <button
              onClick={() => navigate("/sessions")}
              className="flex items-center gap-3 px-6 py-3 font-mono text-sm text-muted-foreground hover:bg-card transition-colors duration-100 text-start"
            >
              <span>{t('sessions')}</span>
            </button>
            <button
              onClick={() => navigate('/events')}
              className="flex items-center gap-3 px-6 py-3 font-mono text-sm font-bold text-foreground bg-card border-l-[3px] border-l-main text-start"
            >
              <span>{t('events')}</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-3 px-6 py-3 font-mono text-sm text-muted-foreground hover:bg-card transition-colors duration-100 text-start"
            >
              <span>{t('settingsNav')}</span>
            </button>
          </nav>
        </aside>

        {/* ───── Main Content ───── */}
        <main className="flex-1 px-6 md:px-12 py-8 md:py-12 pb-20 md:pb-12 overflow-y-auto">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="font-mono font-bold text-sm text-muted-foreground hover:text-foreground transition-colors duration-100 mb-6 inline-flex items-center gap-1"
          >
            &larr; {t('back')}
          </button>

          {/* Error state */}
          {eventError && (
            <div className="border-2 border-destructive bg-destructive/10 p-4 mb-8">
              <p className="font-mono text-sm text-destructive">{eventError}</p>
            </div>
          )}

          {/* Loading skeleton for event */}
          {eventLoading && (
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-2/3 bg-border" />
              <div className="h-5 w-1/3 bg-border" />
              <div className="h-10 w-48 bg-border" />
            </div>
          )}

          {/* Event loaded */}
          {!eventLoading && event && (
            <div>
              {/* Event title */}
              <h1 className="font-heading font-black text-3xl text-foreground leading-tight mb-2">
                {event.name || event.title || "Untitled Event"}
              </h1>
              {event.description && (
                <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-2 max-w-xl">
                  {event.description}
                </p>
              )}
              {event.createdAt && (
                <p className="font-mono text-xs text-muted-foreground tracking-wide mb-6">
                  Created {formatDate(event.createdAt)}
                </p>
              )}

              {/* ───── Tab Bar ───── */}
              <div className="flex border-b-2 border-border mb-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`
                      px-6 py-3 font-mono font-bold text-sm uppercase tracking-[0.08em]
                      transition-colors duration-100 -mb-[2px]
                      ${
                        activeTab === tab.key
                          ? "border-b-[3px] border-b-teal text-foreground"
                          : "border-b-[3px] border-b-transparent text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ───── Details Tab ───── */}
              {activeTab === "details" && (
                <div className="border-2 border-border bg-secondary-background p-6">
                  <h2 className="font-heading font-black text-lg text-foreground mb-4">
                    {t('eventInformation')}
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <span className="font-mono font-bold text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        {t('titleLabel')}
                      </span>
                      <p className="font-mono text-sm text-foreground mt-0.5">
                        {event.name || event.title || "Untitled Event"}
                      </p>
                    </div>
                    {event.description && (
                      <div>
                        <span className="font-mono font-bold text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          {t('descriptionLabel')}
                        </span>
                        <p className="font-mono text-sm text-foreground mt-0.5">
                          {event.description}
                        </p>
                      </div>
                    )}
                    {event.createdAt && (
                      <div>
                        <span className="font-mono font-bold text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          Created
                        </span>
                        <p className="font-mono text-sm text-foreground mt-0.5">
                          {formatDate(event.createdAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ───── Materials / Details Tab Integration ───── */}
              {activeTab === "details" && (
                <MaterialManager
                  entityType="events"
                  entityId={event.id}
                  initialMaterials={event.materials || []}
                  canEdit={userRole === "Provider"}
                  onUpdate={(newMats) => setEvent({ ...event, materials: newMats })}
                />
              )}

              {/* ───── Sessions Tab ───── */}
              {activeTab === "sessions" && (
                <div>
                  {/* Sessions error */}
                  {sessionsError && (
                    <div className="border-2 border-destructive bg-destructive/10 p-4 mb-8">
                      <p className="font-mono text-sm text-destructive">
                        {sessionsError}
                      </p>
                    </div>
                  )}

                  {/* Loading skeletons */}
                  {sessionsLoading && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {[...Array(4)].map((_, i) => (
                        <SessionCardSkeleton key={i} />
                      ))}
                    </div>
                  )}

                  {/* Sessions grid */}
                  {!sessionsLoading && sessions.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {sessions.map((session) => (
                        <SessionCard key={session.id} session={session} />
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {!sessionsLoading &&
                    sessions.length === 0 &&
                    !sessionsError && (
                      <div className="border-2 border-border bg-secondary-background p-12 text-center">
                        <p className="font-heading font-black text-xl text-foreground mb-2">
                          {t('noSessionsYet')}
                        </p>
                        <p className="font-mono text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                          {t('noSessionsEventDescription')}
                        </p>
                        <button
                          onClick={() => setModalOpen(true)}
                          className="bg-main text-main-foreground font-heading font-black text-sm uppercase tracking-widest border-2 border-border shadow-shadow px-5 py-2.5 hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-shadow duration-100"
                        >
                          {t('createSession')}
                        </button>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ───── New Session Modal (eventId pre-filled and locked) ───── */}
      <NewSessionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateSession}
        events={[]}
        eventId={eventId}
        eventTitle={event?.name || event?.title}
      />

      {/* ───── Mobile Bottom Nav ───── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t-2 border-border bg-secondary-background flex">
        {[
          { label: t('dashboard'), path: '/dashboard' },
          { label: t('sessions'), path: '/sessions' },
          { label: t('events'), path: '/events', active: true },
          { label: t('settingsNav'), path: '/settings' },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => !item.active && navigate(item.path)}
            className={`flex-1 min-h-[44px] py-2 font-mono font-bold text-xs uppercase tracking-[0.08em] text-center ${
              item.active ? 'text-main border-t-[3px] border-t-main -mt-[2px]' : 'text-muted-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* ───── Toast ───── */}
      {toast && (
        <div
          className={`
            fixed bottom-6 end-6 z-[60] px-5 py-3 border-2 font-mono text-sm
            transition-all duration-200
            ${
              toast.type === "error"
                ? "bg-destructive/10 border-destructive text-destructive"
                : "bg-main/10 border-main text-foreground"
            }
          `}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
