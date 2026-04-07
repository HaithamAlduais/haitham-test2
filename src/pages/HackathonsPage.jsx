import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet } from "@/utils/apiClient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users, ChevronRight, Filter } from "lucide-react";

const STATUS_VARIANT = {
  draft: "secondary",
  published: "outline",
  active: "success",
  judging: "default",
  completed: "secondary",
};

export default function HackathonsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchHackathons = useCallback(async () => {
    try {
      const data = await apiGet("/api/events");
      setHackathons(data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHackathons(); }, [fetchHackathons]);

  const TYPE_ICON = { hackathon: "\u{1F3C6}", workshop: "\u{1F6E0}\u{FE0F}", seminar: "\u{1F3A4}", training: "\u{1F4DA}", conference: "\u{1F3AF}", other: "\u{2728}" };
  const filtered = typeFilter === "all" ? hackathons : hackathons.filter((h) => h.eventType === typeFilter);

  return (
    <DashboardLayout activePath="/hackathons">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-black text-foreground">{t("myEventsTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("myEventsSubtitle")}</p>
        </div>
        <Button onClick={() => navigate("/events/create")}>
          <Plus className="h-4 w-4" /> {t("createEvent")}
        </Button>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {["all", "hackathon", "workshop", "seminar", "training", "conference"].map((tp) => (
          <Button
            key={tp}
            variant={typeFilter === tp ? "default" : "neutral"}
            size="sm"
            onClick={() => setTypeFilter(tp)}
            className="capitalize"
          >
            {tp === "all" ? t("allTypes") : `${TYPE_ICON[tp] || ""} ${tp}`}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-base border-2 border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-base border-2 border-dashed border-border">
          <p className="text-muted-foreground mb-4">{t("noEventsYetHack")}</p>
          <Button onClick={() => navigate("/events/create")}>
            <Plus className="h-4 w-4" /> {t("createFirstEventHack")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((h) => (
            <button
              key={h.id}
              onClick={() => navigate(`/hackathons/${h.id}`)}
              className="w-full text-start rounded-base border-2 border-border bg-card p-4 hover:shadow-shadow transition-shadow flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span>{TYPE_ICON[h.eventType] || TYPE_ICON.other}</span>
                  <h3 className="font-bold text-foreground truncate">{h.name || h.title}</h3>
                  <Badge variant={STATUS_VARIANT[h.status] || "outline"} className="capitalize shrink-0">
                    {h.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize text-[10px] shrink-0">
                    {h.eventType || "other"}
                  </Badge>
                </div>
                {h.tagline && (
                  <p className="text-sm text-muted-foreground truncate">{h.tagline}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {h.registrationCount || 0} {t("registrations")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {h.teamCount || 0} {t("teams")}
                  </span>
                  {h.schedule?.registrationClose && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {t("closes")} {new Date(h.schedule.registrationClose).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
