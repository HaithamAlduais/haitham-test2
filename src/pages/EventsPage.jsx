import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { apiDelete, apiGet, apiPatch, apiPost } from "../utils/apiClient";
import { formatDate } from "../utils/formatDate";
import EventCreationFlow from "../components/events/EventCreationFlow";
import NewSessionModal from "../components/sessions/NewSessionModal";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";

/**
 * Ramsha — EventsPage
 *
 * Provider-only page listing all events owned by the Provider.
 * Supports ?new=true query param to open a creation modal on load.
 */
const EventsPage = () => {
  const { currentUser, userRole, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const [confirmDeleteEventId, setConfirmDeleteEventId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [savingEventId, setSavingEventId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    visibility: "private",
  });
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionTargetEventId, setSessionTargetEventId] = useState(null);
  const [sessionTargetEventTitle, setSessionTargetEventTitle] = useState("");
  const [linkedSessionCounts, setLinkedSessionCounts] = useState({});
  const [toast, setToast] = useState(null);

  const getEventTypeMeta = (type) => {
    switch (type) {
      case "hackathon":
        return {
          icon: "🏆",
          label: t("typeHackathon"),
          badgeClass: "text-amber-300",
        };
      case "seminar":
        return {
          icon: "🎤",
          label: t("typeSeminar"),
          badgeClass: "text-sky-300",
        };
      case "workshop":
        return {
          icon: "🛠️",
          label: t("typeWorkshop"),
          badgeClass: "text-emerald-400",
        };
      case "training":
        return {
          icon: "📚",
          label: t("typeTraining"),
          badgeClass: "text-violet-300",
        };
      case "conference":
        return {
          icon: "🎯",
          label: t("typeConference"),
          badgeClass: "text-rose-300",
        };
      default:
        return {
          icon: "✨",
          label: t("typeOther"),
          badgeClass: "text-foreground",
        };
    }
  };

  /** Fetch all events owned by this Provider. */
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet('/api/events');
      setEvents(data.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const fetchLinkedSessionCounts = useCallback(async () => {
    try {
      const data = await apiGet('/api/sessions');
      const sessions = data.data ?? [];
      const counts = sessions.reduce((acc, session) => {
        if (!session.eventId) return acc;
        acc[session.eventId] = (acc[session.eventId] || 0) + 1;
        return acc;
      }, {});
      setLinkedSessionCounts(counts);
    } catch {
      setLinkedSessionCounts({});
    }
  }, []);

  useEffect(() => {
    fetchLinkedSessionCounts();
  }, [fetchLinkedSessionCounts]);

  /** Handle ?new=true — open the creation flow on load. */
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowCreateFlow(true);
    }
  }, [searchParams]);

  /** Called when EventCreationFlow closes — refresh the event list. */
  const handleFlowClose = () => {
    setShowCreateFlow(false);
    fetchEvents();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleCreateSessionForEvent = (eventId, eventTitle) => {
    setSessionTargetEventId(eventId);
    setSessionTargetEventTitle(eventTitle || "Untitled Event");
    setSessionModalOpen(true);
  };

  const handleCreateSession = async (data) => {
    try {
      await apiPost("/api/sessions", { ...data, eventId: sessionTargetEventId });
      setSessionModalOpen(false);
      setLinkedSessionCounts((current) => ({
        ...current,
        [sessionTargetEventId]: (current[sessionTargetEventId] || 0) + 1,
      }));
      showToast(t("sessionLinkedCreated"));
    } catch (createError) {
      showToast(createError.message || t("sessionCreateFailed"), "error");
      throw createError;
    }
  };

  const handleEditEvent = (event) => {
    setEditingEventId(event.id);
    setEditForm({
      name: event.name || event.title || "",
      description: event.description || "",
      visibility: event.visibility || "private",
    });
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
  };

  const handleSaveEvent = async (eventId) => {
    if (!editForm.name.trim()) {
      showToast(t("nameRequired"), "error");
      return;
    }

    try {
      setSavingEventId(eventId);
      const updated = await apiPatch(`/api/events/${encodeURIComponent(eventId)}`, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        visibility: editForm.visibility,
      });

      setEvents((current) =>
        current.map((event) => (event.id === eventId ? { ...event, ...updated } : event))
      );
      setEditingEventId(null);
      showToast(t("eventUpdated"));
    } catch (saveError) {
      showToast(saveError.message || t("eventUpdateFailed"), "error");
    } finally {
      setSavingEventId(null);
    }
  };

  const requestDeleteEvent = (eventId) => {
    setConfirmDeleteEventId(eventId);
  };

  const handleDeleteEvent = async () => {
    if (!confirmDeleteEventId) return;

    try {
      setDeletingEventId(confirmDeleteEventId);
      await apiDelete(`/api/events/${encodeURIComponent(confirmDeleteEventId)}`);
      setEvents((current) => current.filter((event) => event.id !== confirmDeleteEventId));
      setLinkedSessionCounts((current) => {
        const updated = { ...current };
        delete updated[confirmDeleteEventId];
        return updated;
      });
      setConfirmDeleteEventId(null);
    } catch (deleteError) {
      setError(deleteError.message || t("eventDeleteFailed"));
    } finally {
      setDeletingEventId(null);
    }
  };

  return (
    <DashboardLayout activePath="/events">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h1 className="font-heading font-black text-3xl text-foreground leading-tight">
              {t('eventsTitle')}
            </h1>
            <Button onClick={() => setShowCreateFlow(true)}>
              <Plus className="h-4 w-4" /> {t('newEvent')}
            </Button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse border-2 border-border bg-secondary-background p-6 h-28"
                />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="border-2 border-destructive bg-destructive/10 p-6 font-mono text-sm text-destructive text-center">
              {error}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && events.length === 0 && (
            <div className="border-2 border-border bg-secondary-background p-12 text-center">
              <p className="font-heading font-black text-xl text-foreground mb-2">
                {t('noEventsYet')}
              </p>
              <p className="font-mono text-sm text-muted-foreground mb-6">
                {t('noEventsDescription')}
              </p>
              <button
                onClick={() => setShowCreateFlow(true)}
                className="border-2 border-main bg-main text-main-foreground font-mono font-bold text-xs uppercase tracking-[0.08em] px-4 py-2 hover:bg-transparent hover:text-main transition-colors duration-100"
              >
                {t('createFirstEvent')}
              </button>
            </div>
          )}

          {/* Event list */}
          {!loading && !error && events.length > 0 && (
            <div className="flex flex-col gap-4">
              {events.map((event) => (
                (() => {
                  const meta = getEventTypeMeta(event.eventType);
                  const isEditing = editingEventId === event.id;
                  const linkedSessionsCount = linkedSessionCounts[event.id] || 0;
                  return (
                    <div key={event.id} className="relative border-2 border-border bg-secondary-background hover:border-main transition-colors duration-100 p-6 pb-14">
                      <button
                        onClick={() => {
                          if (!isEditing) navigate(`/events/${event.id}`);
                        }}
                        className="w-full text-start group"
                      >
                        <div className="flex flex-col gap-3">
                          <div className="min-w-0">
                            {!isEditing ? (
                              <>
                                <h2 className="font-heading font-black text-xl text-foreground group-hover:text-main transition-colors duration-100 truncate">
                                  {event.name || event.title || "Untitled Event"}
                                </h2>

                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.08em] ${meta.badgeClass}`}
                                  >
                                    <span aria-hidden className="text-sm leading-none">{meta.icon}</span>
                                    {meta.label}
                                  </span>
                                </div>

                                {(event.eventCode || event.createdAt) && (
                                  <p className="font-mono text-[11px] text-muted-foreground mt-1 uppercase tracking-[0.08em] inline-flex items-center gap-2">
                                    {event.eventCode && (
                                      <>
                                        <span>{t("eventCodeLabel")}: {event.eventCode}</span>
                                        {event.createdAt && <span aria-hidden>•</span>}
                                      </>
                                    )}
                                    {event.createdAt && <span>{formatDate(event.createdAt)}</span>}
                                  </p>
                                )}

                                {event.description && (
                                  <p className="font-mono text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                              </>
                            ) : (
                              <div className="space-y-2 max-w-xl">
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onClick={(fieldEvent) => fieldEvent.stopPropagation()}
                                  onChange={(fieldEvent) =>
                                    setEditForm((current) => ({ ...current, name: fieldEvent.target.value }))
                                  }
                                  className="w-full border-2 border-border bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-main"
                                />
                                <textarea
                                  rows={2}
                                  value={editForm.description}
                                  onClick={(fieldEvent) => fieldEvent.stopPropagation()}
                                  onChange={(fieldEvent) =>
                                    setEditForm((current) => ({ ...current, description: fieldEvent.target.value }))
                                  }
                                  className="w-full border-2 border-border bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-main resize-none"
                                />
                                <select
                                  value={editForm.visibility}
                                  onClick={(fieldEvent) => fieldEvent.stopPropagation()}
                                  onChange={(fieldEvent) =>
                                    setEditForm((current) => ({ ...current, visibility: fieldEvent.target.value }))
                                  }
                                  className="w-full border-2 border-border bg-secondary-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-main"
                                >
                                  <option value="public">{t("visibilityPublic")}</option>
                                  <option value="private">{t("visibilityPrivate")}</option>
                                </select>
                              </div>
                            )}
                          </div>

                        </div>

                      </button>

                      <div className="absolute bottom-3 start-6 flex items-center gap-2">
                        <button
                          onClick={(sessionEvent) => {
                            sessionEvent.stopPropagation();
                            handleCreateSessionForEvent(
                              event.id,
                              event.name || event.title
                            );
                          }}
                          className="px-2.5 py-1 border border-main text-main font-mono font-bold text-[11px] uppercase tracking-[0.08em] hover:bg-main hover:text-main-foreground transition-colors duration-100"
                          disabled={isEditing}
                        >
                          {t("newSession")}
                        </button>
                        {!isEditing ? (
                          <button
                            onClick={(editEvent) => {
                              editEvent.stopPropagation();
                              handleEditEvent(event);
                            }}
                            className="px-2.5 py-1 border border-border text-foreground font-mono font-bold text-[11px] uppercase tracking-[0.08em] hover:border-main hover:text-main transition-colors duration-100"
                          >
                            {t("editEvent")}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={(saveEvent) => {
                                saveEvent.stopPropagation();
                                handleSaveEvent(event.id);
                              }}
                              disabled={savingEventId === event.id}
                              className="px-2.5 py-1 border-2 border-main bg-main text-main-foreground font-mono font-bold text-[11px] uppercase tracking-[0.08em] hover:bg-transparent hover:text-main transition-colors duration-100 disabled:opacity-60"
                            >
                              {savingEventId === event.id ? t("savingEvent") : t("saveEvent")}
                            </button>
                            <button
                              onClick={(cancelEvent) => {
                                cancelEvent.stopPropagation();
                                handleCancelEdit();
                              }}
                              className="px-2.5 py-1 border border-border text-muted-foreground font-mono font-bold text-[11px] uppercase tracking-[0.08em] hover:border-foreground hover:text-foreground transition-colors duration-100"
                            >
                              {t("cancel")}
                            </button>
                          </>
                        )}
                        <button
                          onClick={(deleteEvent) => {
                            deleteEvent.stopPropagation();
                            requestDeleteEvent(event.id);
                          }}
                          disabled={deletingEventId === event.id || isEditing}
                          className="px-2.5 py-1 border border-destructive text-destructive font-mono font-bold text-[11px] uppercase tracking-[0.08em] hover:bg-destructive hover:text-background transition-colors duration-100 disabled:opacity-60"
                        >
                          {deletingEventId === event.id ? t("deletingEvent") : t("deleteEvent")}
                        </button>

                        {linkedSessionsCount > 0 && !isEditing && (
                          <button
                            onClick={(viewSessionsEvent) => {
                              viewSessionsEvent.stopPropagation();
                              navigate(`/events/${event.id}?tab=sessions`);
                            }}
                            className="px-2.5 py-1 border border-border text-muted-foreground font-mono font-bold text-[11px] uppercase tracking-[0.08em] hover:border-main hover:text-main transition-colors duration-100"
                          >
                            {t("viewLinkedSessions")} ({linkedSessionsCount})
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()
              ))}
            </div>
          )}
      {/* ───── Event Creation Flow ───── */}
      <EventCreationFlow isOpen={showCreateFlow} onClose={handleFlowClose} />

      {/* ───── New Session Modal (from Events list) ───── */}
      <NewSessionModal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        onSubmit={handleCreateSession}
        events={[]}
        eventId={sessionTargetEventId}
        eventTitle={sessionTargetEventTitle}
      />

      {/* ───── Delete Confirmation Dialog ───── */}
      <AlertDialog open={!!confirmDeleteEventId} onOpenChange={(open) => { if (!open) setConfirmDeleteEventId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteEvent")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteEventConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteEvent(); }}
              disabled={deletingEventId === confirmDeleteEventId}
              className="border-destructive bg-destructive/10 text-destructive hover:bg-destructive hover:text-background"
            >
              {deletingEventId === confirmDeleteEventId ? t("deletingEvent") : t("deleteEvent")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

    </DashboardLayout>
  );
};

export default EventsPage;
