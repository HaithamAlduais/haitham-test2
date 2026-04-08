import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet, apiPatch, apiPost } from "@/utils/apiClient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Users, FileText, CheckCircle, XCircle, Clock, Sparkles, Download, BarChart3, Layout } from "lucide-react";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

const STATUS_VARIANT = {
  pending: "outline",
  accepted: "success",
  rejected: "destructive",
  waitlisted: "secondary",
};

function StatCard({ label, value, icon: Icon }) {
  const animated = useAnimatedNumber(value);
  return (
    <div className="rounded-base border-2 border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase mb-1">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="text-2xl font-black text-foreground">{animated}</p>
    </div>
  );
}

export default function ManageHackathonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  const [hackathon, setHackathon] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedRegs, setSelectedRegs] = useState([]);
  const [aiScreening, setAiScreening] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      // First resolve the hackathon (id param could be slug or Firestore ID)
      const h = await apiGet(`/api/events/${id}`);
      const realId = h.id; // always use the Firestore ID for sub-resources
      setHackathon(h);

      const [regs, t] = await Promise.all([
        apiGet(`/api/events/${realId}/registrations`).catch(() => ({ data: [] })),
        apiGet(`/api/events/${realId}/teams/admin/all`).catch(() => ({ data: [] })),
      ]);
      setRegistrations(regs.data || []);
      setTeams(t.data || []);
    } catch {
      navigate("/hackathons");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateRegStatus = async (regId, status) => {
    setActionLoading(regId);
    try {
      await apiPatch(`/api/events/${hackathon?.id || id}/registrations/${regId}`, { status });
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status } : r))
      );
    } catch { /* silently fail */ }
    setActionLoading(null);
  };

  const bulkUpdateStatus = async (status) => {
    if (selectedRegs.length === 0) return;
    setActionLoading("bulk");
    try {
      await apiPost(`/api/events/${hackathon?.id || id}/registrations/bulk-status`, {
        registrationIds: selectedRegs,
        status,
      });
      setRegistrations((prev) =>
        prev.map((r) => (selectedRegs.includes(r.id) ? { ...r, status } : r))
      );
      setSelectedRegs([]);
    } catch { /* silently fail */ }
    setActionLoading(null);
  };

  const updateHackathonStatus = async (newStatus) => {
    setActionLoading("status");
    try {
      await apiPatch(`/api/events/${hackathon?.id || id}/status`, { status: newStatus });
      setHackathon((prev) => ({ ...prev, status: newStatus }));
    } catch { /* silently fail */ }
    setActionLoading(null);
  };

  const toggleRegSelect = (regId) => {
    setSelectedRegs((prev) =>
      prev.includes(regId) ? prev.filter((r) => r !== regId) : [...prev, regId]
    );
  };

  const selectAllRegs = () => {
    if (selectedRegs.length === registrations.length) {
      setSelectedRegs([]);
    } else {
      setSelectedRegs(registrations.map((r) => r.id));
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!hackathon) return null;

  const pendingCount = registrations.filter((r) => r.status === "pending").length;
  const acceptedCount = registrations.filter((r) => r.status === "accepted").length;

  const nextStatus = {
    draft: "published",
    published: "active",
    active: "judging",
    judging: "completed",
  }[hackathon.status];

  const nextStatusLabel = {
    published: t("publishStatus"),
    active: t("startHackathon"),
    judging: t("beginJudging"),
    completed: t("completeStatus"),
  };

  return (
    <DashboardLayout activePath="/hackathons">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/hackathons")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> {t("backToHackathons")}
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-black text-foreground">{hackathon.title}</h1>
              <Badge variant={STATUS_VARIANT[hackathon.status] || "outline"} className="capitalize">
                {hackathon.status}
              </Badge>
            </div>
            {hackathon.tagline && (
              <p className="text-sm text-muted-foreground mt-1">{hackathon.tagline}</p>
            )}
            {/* Public hackathon link */}
            {hackathon.slug && (
              <div className="flex items-center gap-2 mt-2">
                <a
                  href={`/hackathon/${hackathon.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-main font-bold hover:underline truncate max-w-md"
                >
                  ramsha.net/hackathon/{hackathon.slug}
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://ramsha.net/hackathon/${hackathon.slug}`);
                  }}
                  className="text-xs text-muted-foreground hover:text-main border border-border rounded px-2 py-0.5"
                >
                  {t("copy") || "نسخ"}
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {nextStatus && (
              <Button
                onClick={() => updateHackathonStatus(nextStatus)}
                disabled={actionLoading === "status"}
              >
                {actionLoading === "status" ? t("updating") : nextStatusLabel[nextStatus] || nextStatus}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label={t("registrationsLabel")} value={registrations.length} icon={FileText} />
        <StatCard label={t("pendingLabel")} value={pendingCount} icon={Clock} />
        <StatCard label={t("acceptedLabel")} value={acceptedCount} icon={CheckCircle} />
        <StatCard label={t("teamsLabel")} value={teams.length} icon={Users} />
      </div>

      <Separator className="mb-6" />

      {/* Tabs */}
      <Tabs defaultValue="registrations">
        <TabsList className="mb-4">
          <TabsTrigger value="registrations">{t("registrationsTab")} ({registrations.length})</TabsTrigger>
          <TabsTrigger value="teams">{t("teamsTab")} ({teams.length})</TabsTrigger>
          <TabsTrigger value="settings">{t("settingsTab")}</TabsTrigger>
        </TabsList>

        {/* ── Registrations Tab ── */}
        <TabsContent value="registrations">
          {/* AI Screening button */}
          <div className="flex gap-2 mb-4">
            <Button
              variant="neutral"
              size="sm"
              onClick={async () => {
                setAiScreening(true);
                try {
                  await apiPost(`/api/events/${hackathon?.id || id}/ai/screen-all-registrations`);
                  await fetchAll();
                } catch { /* silently fail */ }
                setAiScreening(false);
              }}
              disabled={aiScreening}
            >
              <Sparkles className="h-4 w-4" />
              {aiScreening ? t("screening") : t("aiScreenPending")}
            </Button>
          </div>

          {selectedRegs.length > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-base border-2 border-main bg-main/5">
              <span className="text-sm font-bold">{selectedRegs.length} {t("selected")}</span>
              <Button size="sm" onClick={() => bulkUpdateStatus("accepted")} disabled={actionLoading === "bulk"}>
                {t("acceptAll")}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => bulkUpdateStatus("rejected")} disabled={actionLoading === "bulk"}>
                {t("rejectAll")}
              </Button>
              <Button size="sm" variant="neutral" onClick={() => setSelectedRegs([])}>
                {t("clear")}
              </Button>
            </div>
          )}

          {registrations.length === 0 ? (
            <div className="text-center py-12 rounded-base border-2 border-dashed border-border">
              <p className="text-muted-foreground">{t("noRegistrationsYet")}</p>
            </div>
          ) : (
            <div className="rounded-base border-2 border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedRegs.length === registrations.length && registrations.length > 0}
                        onChange={selectAllRegs}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>{t("emailCol")}</TableHead>
                    <TableHead>{t("statusCol")}</TableHead>
                    <TableHead>{t("aiScoreCol")}</TableHead>
                    <TableHead>{t("dateCol")}</TableHead>
                    <TableHead className="text-end">{t("actionsCol")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRegs.includes(reg.id)}
                          onChange={() => toggleRegSelect(reg.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{reg.userEmail || reg.userId}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[reg.status] || "outline"} className="capitalize">
                          {reg.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {reg.aiScore != null ? (
                          <span className={`text-sm font-bold ${reg.aiScore >= 70 ? "text-main" : reg.aiScore >= 40 ? "text-foreground" : "text-destructive"}`}>
                            {reg.aiScore}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {reg.createdAt?.toDate
                          ? reg.createdAt.toDate().toLocaleDateString()
                          : reg.createdAt
                          ? new Date(reg.createdAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex gap-1 justify-end">
                          {reg.status !== "accepted" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateRegStatus(reg.id, "accepted")}
                              disabled={actionLoading === reg.id}
                            >
                              <CheckCircle className="h-4 w-4 text-main" />
                            </Button>
                          )}
                          {reg.status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateRegStatus(reg.id, "rejected")}
                              disabled={actionLoading === reg.id}
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ── Teams Tab ── */}
        <TabsContent value="teams">
          {teams.length === 0 ? (
            <div className="text-center py-12 rounded-base border-2 border-dashed border-border">
              <p className="text-muted-foreground">{t("noTeamsYet")}</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <div key={team.id} className="rounded-base border-2 border-border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">{team.name}</h3>
                    <Badge variant="outline" className="capitalize">{team.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {team.memberCount || 1} member{(team.memberCount || 1) > 1 ? "s" : ""}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">Code: {team.code}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Settings Tab ── */}
        <TabsContent value="settings">
          <div className="space-y-4 max-w-2xl">
            <div className="rounded-base border-2 border-border p-4">
              <h3 className="font-bold text-foreground mb-2">{t("hackathonDetails2")}</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Title:</span> {hackathon.title}</p>
                <p><span className="text-muted-foreground">Slug:</span> {hackathon.slug}</p>
                <p><span className="text-muted-foreground">Status:</span> {hackathon.status}</p>
                <p><span className="text-muted-foreground">Public:</span> {hackathon.isPublic ? "Yes" : "No"}</p>
                <p><span className="text-muted-foreground">Max Registrants:</span> {hackathon.settings?.maxRegistrants || 500}</p>
                <p><span className="text-muted-foreground">Team Size:</span> {hackathon.settings?.teamSizeMin}–{hackathon.settings?.teamSizeMax}</p>
              </div>
            </div>
            <div className="rounded-base border-2 border-border p-4">
              <h3 className="font-bold text-foreground mb-2">{t("publicLink")}</h3>
              <p className="text-sm font-mono text-main break-all">
                {window.location.origin}/event/{id}
              </p>
            </div>
            <div className="rounded-base border-2 border-border p-4">
              <h3 className="font-bold text-foreground mb-2">{t("exportData")}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                <Button variant="neutral" size="sm" onClick={() => window.open(`/api/export/${id}/registrations`, '_blank')}>
                  <Download className="h-3 w-3" /> {t("exportRegistrations")}
                </Button>
                <Button variant="neutral" size="sm" onClick={() => window.open(`/api/export/${id}/teams`, '_blank')}>
                  <Download className="h-3 w-3" /> {t("exportTeams")}
                </Button>
                <Button variant="neutral" size="sm" onClick={() => window.open(`/api/export/${id}/submissions`, '_blank')}>
                  <Download className="h-3 w-3" /> {t("exportSubmissions")}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
