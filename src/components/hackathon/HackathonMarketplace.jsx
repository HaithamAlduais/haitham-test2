import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, ArrowRight } from "lucide-react";

const STATUS_COLORS = {
  published: "outline",
  active: "success",
  judging: "secondary",
  completed: "secondary",
};

function HackathonPreviewCard({ hackathon }) {
  const navigate = useNavigate();
  const status = hackathon.status || "published";
  const trackCount = (hackathon.tracks || []).length;
  const regOpen = hackathon.schedule?.registrationOpen;
  const regClose = hackathon.schedule?.registrationClose;

  return (
    <button
      onClick={() => navigate(`/event/${hackathon.id}`)}
      className="text-start rounded-base border-2 border-border bg-card p-5 shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all duration-100 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <Badge variant={STATUS_COLORS[status] || "outline"} className="capitalize">
          {status}
        </Badge>
        {trackCount > 0 && (
          <span className="text-xs text-muted-foreground">{trackCount} track{trackCount > 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-heading font-black text-lg text-foreground leading-tight mb-1">
        {hackathon.title}
      </h3>
      {hackathon.tagline && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{hackathon.tagline}</p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        {regOpen && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(regOpen).toLocaleDateString()}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {hackathon.registrationCount || 0} registered
        </span>
      </div>

      {/* CTA */}
      <span className="flex items-center gap-1 text-xs font-bold text-main group-hover:underline">
        View Details <ArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}

export default function HackathonMarketplace() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events/public")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        console.log("[Marketplace] Loaded events:", json.data?.length || 0);
        setHackathons(json.data || []);
      })
      .catch((err) => {
        console.error("[Marketplace] Failed:", err);
        setHackathons([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="marketplace" className="py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-heading font-black text-3xl md:text-4xl text-foreground mb-3">
            Explore Events
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Browse upcoming hackathons, workshops, seminars, training, and conferences.
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-base border-2 border-border bg-card p-5 h-48 animate-pulse" />
            ))}
          </div>
        ) : hackathons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hackathons.map((h) => (
              <HackathonPreviewCard key={h.id} hackathon={h} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-base border-2 border-dashed border-border">
            <p className="text-muted-foreground mb-4">No events available yet.</p>
            <Button variant="neutral" onClick={() => navigate("/explore")}>
              Browse All Events
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
