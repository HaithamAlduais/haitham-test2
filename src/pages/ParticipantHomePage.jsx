import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet } from "@/utils/apiClient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, FileText, Trophy, ArrowRight, Search } from "lucide-react";

const TYPE_ICON = { hackathon: "\u{1F3C6}", workshop: "\u{1F6E0}\u{FE0F}", seminar: "\u{1F3A4}", training: "\u{1F4DA}", conference: "\u{1F3AF}", other: "\u{2728}" };

const STATUS_VARIANT = {
  pending: "outline",
  accepted: "success",
  rejected: "destructive",
  draft: "outline",
  submitted: "success",
  forming: "outline",
  complete: "success",
};

const ParticipantHomePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [myEvents, setMyEvents] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [events, teams, subs] = await Promise.all([
        apiGet("/api/participant/my-events").catch(() => ({ data: [] })),
        apiGet("/api/participant/my-teams").catch(() => ({ data: [] })),
        apiGet("/api/participant/my-submissions").catch(() => ({ data: [] })),
      ]);
      setMyEvents(events.data || []);
      setMyTeams(teams.data || []);
      setMySubmissions(subs.data || []);
    } catch { /* silently fail */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <DashboardLayout activePath="/home">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-black text-foreground">{t("myDashboard")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("myDashboardSubtitle")}</p>
        </div>
        <Button onClick={() => navigate("/explore")}>
          <Search className="h-4 w-4" /> {t("exploreEvents")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-base border-2 border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase mb-1"><Calendar className="h-3.5 w-3.5" /> {t("eventsStatLabel")}</div>
          <p className="text-2xl font-black text-foreground">{myEvents.length}</p>
        </div>
        <div className="rounded-base border-2 border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase mb-1"><Users className="h-3.5 w-3.5" /> {t("teamsStatLabel")}</div>
          <p className="text-2xl font-black text-foreground">{myTeams.length}</p>
        </div>
        <div className="rounded-base border-2 border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase mb-1"><Trophy className="h-3.5 w-3.5" /> {t("submissionsStatLabel")}</div>
          <p className="text-2xl font-black text-foreground">{mySubmissions.length}</p>
        </div>
      </div>

      <Tabs defaultValue="events">
        <TabsList className="mb-4">
          <TabsTrigger value="events">{t("myEventsTab")} ({myEvents.length})</TabsTrigger>
          <TabsTrigger value="teams">{t("myTeams")} ({myTeams.length})</TabsTrigger>
          <TabsTrigger value="submissions">{t("mySubmissions")} ({mySubmissions.length})</TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-base border-2 border-border bg-card animate-pulse" />)}</div>
          ) : myEvents.length === 0 ? (
            <div className="text-center py-12 rounded-base border-2 border-dashed border-border">
              <p className="text-muted-foreground mb-4">{t("noEventsRegistered")}</p>
              <Button onClick={() => navigate("/explore")}>{t("browseEvents")}</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myEvents.map((e) => (
                <button
                  key={e.registrationId}
                  onClick={() => navigate(`/event/${e.eventId}`)}
                  className="w-full text-start rounded-base border-2 border-border bg-card p-4 hover:shadow-shadow transition-shadow flex items-center gap-4"
                >
                  <span className="text-xl">{TYPE_ICON[e.eventType] || TYPE_ICON.other}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground truncate">{e.eventName}</h3>
                      <Badge variant={STATUS_VARIANT[e.registrationStatus] || "outline"} className="capitalize shrink-0">
                        {e.registrationStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{e.eventType} &middot; {e.eventStatus}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams">
          {myTeams.length === 0 ? (
            <div className="text-center py-12 rounded-base border-2 border-dashed border-border">
              <p className="text-muted-foreground">{t("noTeamsJoined")}</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {myTeams.map((t) => (
                <div key={t.teamId} className="rounded-base border-2 border-border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">{t.teamName}</h3>
                    <Badge variant={STATUS_VARIANT[t.teamStatus] || "outline"} className="capitalize">{t.teamStatus}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.eventName}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">Role: {t.memberRole}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">Code: {t.teamCode}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          {mySubmissions.length === 0 ? (
            <div className="text-center py-12 rounded-base border-2 border-dashed border-border">
              <p className="text-muted-foreground">{t("noSubmissionsYet")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mySubmissions.map((s) => (
                <div key={s.submissionId} className="rounded-base border-2 border-border bg-card p-4 flex items-center gap-4">
                  <Trophy className="h-5 w-5 text-main shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground truncate">{s.projectName}</h3>
                      <Badge variant={STATUS_VARIANT[s.status] || "outline"} className="capitalize shrink-0">{s.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.eventName}</p>
                  </div>
                  {s.totalScore != null && (
                    <span className="text-lg font-black text-main">{Math.round(s.totalScore)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ParticipantHomePage;
