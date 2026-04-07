import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useLiveAttendance } from "../hooks/useLiveAttendance";
import SessionStatsBar from "../components/sessions/SessionStatsBar";
import QRDisplay from "../components/sessions/QRDisplay";
import F2FInfoCard from "../components/sessions/F2FInfoCard";
import AttendeeList from "../components/sessions/AttendeeList";
import MaterialManager from "../components/materials/MaterialManager";

/**
 * Ramsha — LiveMonitoringPage
 *
 * The Provider's real-time session monitoring view. Displays session info,
 * live attendance stats, QR code or F2F proximity details, and the
 * attendee list. Polls the API while the session is active.
 *
 * Accessed via /sessions/:id (React Router).
 */

/** Status badge configuration — matches SessionCard.jsx */
const STATUS_CONFIG = {
  draft: { label: "DRAFT", badge: "bg-smoke text-background", dot: false },
  active: { label: "ACTIVE", badge: "bg-main text-main-foreground", dot: true },
  closed: { label: "CLOSED", badge: "bg-destructive/20 text-destructive", dot: false },
};

const LiveMonitoringPage = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userRole, logout } = useAuth();
  const { t } = useLanguage();

  const {
    session,
    attendance,
    stats,
    loading,
    error,
    activateSession,
    closeSession,
  } = useLiveAttendance(sessionId);

  // Action states
  const [activating, setActivating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  /** Show a temporary toast notification. */
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /** Activate a draft session. For F2F, request geolocation first. */
  const handleActivate = async () => {
    setActivating(true);
    try {
      if (session.sessionType === "f2f") {
        // Request Provider's geolocation for F2F sessions
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });

        await activateSession({
          instructorLocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          radiusMeters: session.radiusMeters || 100,
        });
      } else {
        await activateSession();
      }
      showToast(t('sessionActivated'));
    } catch (err) {
      showToast(
        err.message || t('sessionActivateFailed'),
        "error"
      );
    } finally {
      setActivating(false);
    }
  };

  /** Close an active session after confirmation. */
  const handleCloseConfirm = async () => {
    setClosing(true);
    try {
      await closeSession();
      setShowCloseConfirm(false);
      showToast(t('sessionClosed'));
    } catch (err) {
      showToast(err.message || t('sessionCloseFailed'), "error");
    } finally {
      setClosing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Derived helpers
  const status = session?.status || "draft";
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const isActive = status === "active";
  const isDraft = status === "draft";
  const isClosed = status === "closed";

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
              className="flex items-center gap-3 px-6 py-3 font-mono text-sm font-bold text-foreground bg-card border-l-[3px] border-l-main text-start"
            >
              <span>{t('sessions')}</span>
            </button>
            <button
              onClick={() => navigate('/events')}
              className="flex items-center gap-3 px-6 py-3 font-mono text-sm text-muted-foreground hover:bg-card transition-colors duration-100 text-start"
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
            onClick={() => navigate("/sessions")}
            className="font-mono font-bold text-sm text-muted-foreground hover:text-foreground transition-colors duration-100 mb-6 inline-flex items-center gap-1"
          >
            &larr; {t('backToSessions')}
          </button>

          {/* Error state */}
          {error && (
            <div className="border-2 border-destructive bg-destructive/10 p-4 mb-8">
              <p className="font-mono text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-2/3 bg-border" />
              <div className="h-5 w-1/3 bg-border" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-border" />
                ))}
              </div>
              <div className="h-64 bg-border" />
            </div>
          )}

          {/* Loaded session content */}
          {!loading && session && (
            <div className="space-y-8">
              {/* ── Session Header ── */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="font-heading font-black text-3xl text-foreground leading-tight mb-3">
                    {session.title}
                  </h1>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {/* Status */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono font-bold text-xs uppercase tracking-[0.12em] ${config.badge}`}
                    >
                      {config.dot && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full bg-foreground opacity-40" />
                          <span className="relative inline-flex h-2 w-2 bg-foreground" />
                        </span>
                      )}
                      {config.label}
                    </span>

                    {/* Session type */}
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-border text-muted-foreground font-mono text-xs uppercase tracking-[0.08em]">
                      {session.sessionType === "qr_code"
                        ? t('qrCode')
                        : t('faceToFace')}
                    </span>
                  </div>

                  {/* Notes */}
                  {session.notes && (
                    <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-xl">
                      {session.notes}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 shrink-0">
                  {/* Activate button — draft only */}
                  {isDraft && (
                    <button
                      onClick={handleActivate}
                      disabled={activating}
                      className={`font-heading font-black text-sm uppercase tracking-widest border-2 border-border shadow-shadow px-5 py-2.5 transition-shadow duration-100 ${
                        activating
                          ? "bg-border text-muted-foreground cursor-not-allowed"
                          : "bg-main text-main-foreground hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
                      }`}
                    >
                      {activating ? t('activating') : t('activateSession')}
                    </button>
                  )}

                  {/* Close button — active only */}
                  {isActive && (
                    <button
                      onClick={() => setShowCloseConfirm(true)}
                      className="font-heading font-black text-sm uppercase tracking-widest border-[3px] border-destructive text-destructive px-5 py-2.5 hover:bg-destructive hover:text-background transition-colors duration-100"
                    >
                      {t('closeSessionBtn')}
                    </button>
                  )}
                </div>
              </div>

              {/* ── Closed Banner ── */}
              {isClosed && (
                <div className="border-2 border-destructive bg-destructive/10 p-5">
                  <p className="font-heading font-black text-sm text-destructive uppercase tracking-widest mb-1">
                    {t('sessionEnded')}
                  </p>
                  <p className="font-mono text-sm text-destructive/80">
                    {t('sessionEndedDescription')}
                  </p>
                </div>
              )}

              {/* ── Stats Bar ── */}
              <SessionStatsBar
                total={stats.total}
                present={stats.present}
                late={stats.late}
              />

              {/* ── QR Code Display — active QR sessions ── */}
              {session.sessionType === "qr_code" && isActive && (
                <QRDisplay qrCode={session.qrCode} />
              )}

              {/* ── F2F Info Card — active F2F sessions ── */}
              {session.sessionType === "f2f" && isActive && (
                <F2FInfoCard
                  radiusMeters={session.radiusMeters}
                  instructorLocation={session.instructorLocation}
                />
              )}

              {/* ── Materials Manager ── */}
              <MaterialManager
                entityType="sessions"
                entityId={session.id || sessionId}
                initialMaterials={session.materials || []}
                canEdit={userRole === "Provider"}
              />

              {/* ── Attendee List ── */}
              <div>
                <h2 className="font-heading font-black text-xl text-foreground mb-4">
                  {t('attendees')}
                </h2>
                <AttendeeList
                  attendance={attendance}
                  isActive={isActive}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ───── Close Confirmation Dialog ───── */}
      {showCloseConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60"
          onClick={() => setShowCloseConfirm(false)}
        >
          <div
            className="w-full max-w-sm mx-4 border-2 border-border bg-background p-6 shadow-shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading font-black text-lg text-foreground mb-2">
              {t('closeSessionConfirm')}
            </h3>
            <p className="font-mono text-sm text-muted-foreground mb-6">
              {t('closeSessionWarning')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 font-mono font-bold text-sm uppercase tracking-[0.08em] border-2 border-border text-muted-foreground px-4 py-2.5 hover:border-foreground hover:text-foreground transition-colors duration-100"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCloseConfirm}
                disabled={closing}
                className={`flex-1 font-heading font-black text-sm uppercase tracking-widest border-[3px] px-4 py-2.5 transition-colors duration-100 ${
                  closing
                    ? "bg-border text-muted-foreground border-border cursor-not-allowed"
                    : "bg-destructive text-background border-destructive hover:bg-destructive/80"
                }`}
              >
                {closing ? t('closing') : t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── Mobile Bottom Nav ───── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t-2 border-border bg-secondary-background flex">
        {[
          { label: t('dashboard'), path: '/dashboard' },
          { label: t('sessions'), path: '/sessions', active: true },
          { label: t('events'), path: '/events' },
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
          className={`fixed bottom-6 end-6 z-[60] px-5 py-3 border-2 font-mono text-sm transition-all duration-200 ${
            toast.type === "error"
              ? "bg-destructive/10 border-destructive text-destructive"
              : "bg-main/10 border-main text-foreground"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default LiveMonitoringPage;
