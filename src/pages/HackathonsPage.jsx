import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet, apiPatch, apiDelete, apiPost } from "@/utils/apiClient";
import { formatDate } from "@/utils/formatDate";
import EventCreationFlow from "@/components/events/EventCreationFlow";
import NewSessionModal from "@/components/sessions/NewSessionModal";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Calendar, Users, ChevronRight, Pencil, Trash2, Link2 } from "lucide-react";

const STATUS_VARIANT = { draft: "secondary", published: "outline", active: "success", judging: "default", completed: "secondary" };
const TYPE_ICON = { hackathon: "🏆", workshop: "🛠️", seminar: "🎤", training: "📚", conference: "🎯", other: "✨" };

export default function HackathonsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", visibility: "private" });
  const [savingId, setSavingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [sessionModal, setSessionModal] = useState({ open: false, eventId: null, eventTitle: "" });
  const [linkedCounts, setLinkedCounts] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchEvents = useCallback(async () => {
    try { const d = await apiGet("/api/events"); setEvents(d.data || []); } catch {} finally { setLoading(false); }
  }, []);

  const fetchLinkedCounts = useCallback(async () => {
    try {
      const d = await apiGet("/api/sessions");
      const c = {};
      (d.data || []).forEach(s => { if (s.eventId) c[s.eventId] = (c[s.eventId] || 0) + 1; });
      setLinkedCounts(c);
    } catch {}
  }, []);

  useEffect(() => { fetchEvents(); fetchLinkedCounts(); }, [fetchEvents, fetchLinkedCounts]);
  useEffect(() => { if (searchParams.get("new") === "true") setShowCreateFlow(true); }, [searchParams]);

  const startEdit = (ev) => { setEditingId(ev.id); setEditForm({ name: ev.name || ev.title || "", description: ev.description || "", visibility: ev.visibility || "private" }); };
  const saveEdit = async (id) => {
    if (!editForm.name.trim()) return;
    setSavingId(id);
    try { await apiPatch(`/api/events/${id}`, editForm); setEvents(evs => evs.map(e => e.id === id ? { ...e, ...editForm } : e)); setEditingId(null); showToast(t("eventUpdated") || "Updated"); }
    catch (err) { showToast(err.message, "error"); } finally { setSavingId(null); }
  };
  const doDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    try { await apiDelete(`/api/events/${confirmDeleteId}`); setEvents(evs => evs.filter(e => e.id !== confirmDeleteId)); setConfirmDeleteId(null); }
    catch (err) { showToast(err.message, "error"); } finally { setDeletingId(null); }
  };
  const createSession = async (data) => {
    try { await apiPost("/api/sessions", { ...data, eventId: sessionModal.eventId }); setSessionModal({ open: false, eventId: null, eventTitle: "" }); setLinkedCounts(c => ({ ...c, [sessionModal.eventId]: (c[sessionModal.eventId] || 0) + 1 })); showToast(t("sessionLinkedCreated") || "Session created"); }
    catch (err) { showToast(err.message, "error"); throw err; }
  };

  const filtered = typeFilter === "all" ? events : events.filter(h => h.eventType === typeFilter);

  return (
    <DashboardLayout activePath="/events">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-black text-foreground">{t("myEventsTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("myEventsSubtitle")}</p>
        </div>
        <Button onClick={() => setShowCreateFlow(true)}><Plus className="h-4 w-4" /> {t("createEvent")}</Button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {["all", "hackathon", "workshop", "seminar", "training", "conference"].map(tp => (
          <Button key={tp} variant={typeFilter === tp ? "default" : "neutral"} size="sm" onClick={() => setTypeFilter(tp)} className="capitalize">
            {tp === "all" ? t("allTypes") : `${TYPE_ICON[tp] || ""} ${t(`type${tp.charAt(0).toUpperCase() + tp.slice(1)}`) || tp}`}
          </Button>
        ))}
      </div>

      {loading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-base border-2 border-border bg-card animate-pulse" />)}</div>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 rounded-base border-2 border-dashed border-border">
          <p className="text-muted-foreground mb-4">{t("noEventsYet")}</p>
          <Button onClick={() => setShowCreateFlow(true)}><Plus className="h-4 w-4" /> {t("createFirstEvent")}</Button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(ev => {
            const isHack = ev.eventType === "hackathon";
            const isEditing = editingId === ev.id;
            const linked = linkedCounts[ev.id] || 0;
            return (
              <div key={ev.id} className="rounded-base border-2 border-border bg-card p-4 hover:border-main/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {!isEditing ? (
                      <button onClick={() => isHack ? navigate(`/hackathons/${ev.id}`) : null} className="w-full text-start group">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-lg">{TYPE_ICON[ev.eventType] || TYPE_ICON.other}</span>
                          <h3 className="font-bold text-foreground group-hover:text-main truncate">{ev.name || ev.title || "Untitled"}</h3>
                          <Badge variant={STATUS_VARIANT[ev.status] || "outline"} className="capitalize shrink-0">{ev.status}</Badge>
                          <Badge variant="outline" className="capitalize text-[10px] shrink-0">{ev.eventType || "other"}</Badge>
                        </div>
                        {(ev.tagline || ev.description) && <p className="text-sm text-muted-foreground truncate">{ev.tagline || ev.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {ev.registrationCount || 0} {t("registrations")}</span>
                          {ev.teamCount > 0 && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {ev.teamCount} {t("teams")}</span>}
                          {ev.createdAt && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(ev.createdAt)}</span>}
                        </div>
                      </button>
                    ) : (
                      <div className="space-y-2" onClick={e => e.stopPropagation()}>
                        <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full border-2 border-border bg-background rounded-base px-3 py-2 text-sm font-medium" />
                        <textarea rows={2} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="w-full border-2 border-border bg-background rounded-base px-3 py-2 text-sm resize-none" />
                        <select value={editForm.visibility} onChange={e => setEditForm(f => ({ ...f, visibility: e.target.value }))} className="border-2 border-border bg-background rounded-base px-3 py-2 text-sm">
                          <option value="public">{t("visibilityPublic") || "Public"}</option>
                          <option value="private">{t("visibilityPrivate") || "Private"}</option>
                        </select>
                      </div>
                    )}
                  </div>
                  {isHack && !isEditing && (
                    <button onClick={() => navigate(`/hackathons/${ev.id}`)} className="shrink-0 p-2 text-muted-foreground hover:text-main"><ChevronRight className="h-5 w-5" /></button>
                  )}
                </div>

                {/* Actions for non-hackathon events */}
                {!isHack && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
                    {!isEditing ? (
                      <>
                        <Button size="sm" variant="neutral" onClick={() => setSessionModal({ open: true, eventId: ev.id, eventTitle: ev.name || ev.title })}><Plus className="h-3 w-3" /> {t("newSession") || "+ جلسة جديدة"}</Button>
                        <Button size="sm" variant="neutral" onClick={() => startEdit(ev)}><Pencil className="h-3 w-3" /> {t("editEvent") || "تعديل"}</Button>
                        <Button size="sm" variant="neutral" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setConfirmDeleteId(ev.id)}><Trash2 className="h-3 w-3" /> {t("deleteEvent") || "حذف"}</Button>
                        {linked > 0 && <Button size="sm" variant="neutral" onClick={() => navigate(`/events/${ev.id}?tab=sessions`)}><Link2 className="h-3 w-3" /> {t("viewLinkedSessions") || "الجلسات"} ({linked})</Button>}
                      </>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => saveEdit(ev.id)} disabled={savingId === ev.id}>{savingId === ev.id ? "..." : t("saveEvent") || "حفظ"}</Button>
                        <Button size="sm" variant="neutral" onClick={() => setEditingId(null)}>{t("cancel")}</Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <EventCreationFlow isOpen={showCreateFlow} onClose={() => { setShowCreateFlow(false); fetchEvents(); }} />
      <NewSessionModal isOpen={sessionModal.open} onClose={() => setSessionModal({ open: false, eventId: null, eventTitle: "" })} onSubmit={createSession} events={[]} eventId={sessionModal.eventId} eventTitle={sessionModal.eventTitle} />

      <AlertDialog open={!!confirmDeleteId} onOpenChange={o => { if (!o) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("deleteEvent") || "حذف"}</AlertDialogTitle><AlertDialogDescription>{t("deleteEventConfirm") || "هل أنت متأكد؟"}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={e => { e.preventDefault(); doDelete(); }} className="border-destructive bg-destructive/10 text-destructive hover:bg-destructive hover:text-background">{deletingId === confirmDeleteId ? "..." : t("deleteEvent") || "حذف"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {toast && <div className={`fixed bottom-6 end-6 z-[60] px-5 py-3 rounded-base border-2 font-bold text-sm ${toast.type === "error" ? "bg-destructive/10 border-destructive text-destructive" : "bg-main/10 border-main text-foreground"}`}>{toast.message}</div>}
    </DashboardLayout>
  );
}
