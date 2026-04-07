import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet } from "@/utils/apiClient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Users, ChevronRight } from "lucide-react";

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

  const fetchHackathons = useCallback(async () => {
    try {
      const data = await apiGet("/api/hackathons");
      setHackathons(data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHackathons(); }, [fetchHackathons]);

  return (
    <DashboardLayout activePath="/hackathons">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-black text-foreground">Hackathons</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your hackathon events</p>
        </div>
        <Button onClick={() => navigate("/events/create")}>
          <Plus className="h-4 w-4" /> Create Hackathon
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-base border-2 border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : hackathons.length === 0 ? (
        <div className="text-center py-16 rounded-base border-2 border-dashed border-border">
          <p className="text-muted-foreground mb-4">No hackathons yet.</p>
          <Button onClick={() => navigate("/events/create")}>
            <Plus className="h-4 w-4" /> Create Your First Hackathon
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {hackathons.map((h) => (
            <button
              key={h.id}
              onClick={() => navigate(`/hackathons/${h.id}`)}
              className="w-full text-start rounded-base border-2 border-border bg-card p-4 hover:shadow-shadow transition-shadow flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-foreground truncate">{h.title}</h3>
                  <Badge variant={STATUS_VARIANT[h.status] || "outline"} className="capitalize shrink-0">
                    {h.status}
                  </Badge>
                </div>
                {h.tagline && (
                  <p className="text-sm text-muted-foreground truncate">{h.tagline}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {h.registrationCount || 0} registrations
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {h.teamCount || 0} teams
                  </span>
                  {h.schedule?.registrationClose && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Closes {new Date(h.schedule.registrationClose).toLocaleDateString()}
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
