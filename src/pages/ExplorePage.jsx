import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Users, ArrowRight, Filter } from "lucide-react";

const STATUS_VARIANT = {
  published: "outline",
  active: "success",
  judging: "default",
  completed: "secondary",
};

function HackathonCard({ hackathon }) {
  const navigate = useNavigate();
  const tracks = hackathon.tracks || [];

  return (
    <button
      onClick={() => navigate(`/hackathon/${hackathon.slug}`)}
      className="w-full text-start rounded-base border-2 border-border bg-card p-5 shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all duration-100 group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <Badge variant={STATUS_VARIANT[hackathon.status] || "outline"} className="capitalize">
          {hackathon.status}
        </Badge>
        {tracks.length > 0 && (
          <span className="text-xs text-muted-foreground">{tracks.length} track{tracks.length > 1 ? "s" : ""}</span>
        )}
      </div>
      <h3 className="font-heading font-black text-lg text-foreground leading-tight mb-1">{hackathon.title}</h3>
      {hackathon.tagline && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{hackathon.tagline}</p>
      )}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {tracks.slice(0, 3).map((t, i) => (
          <Badge key={i} variant="outline" className="text-[10px]">{t.name}</Badge>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        {hackathon.schedule?.registrationOpen && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(hackathon.schedule.registrationOpen).toLocaleDateString()}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {hackathon.registrationCount || 0} registered
        </span>
      </div>
      <span className="flex items-center gap-1 text-xs font-bold text-main group-hover:underline">
        View Details <ArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}

export default function ExplorePage() {
  const { dir } = useLanguage();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/api/hackathons/public")
      .then((res) => res.json())
      .then((json) => setHackathons(json.data || []))
      .catch(() => setHackathons([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = hackathons.filter((h) => {
    const matchesSearch =
      !search ||
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      (h.tagline || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || h.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ["all", "published", "active", "judging", "completed"];

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      {/* Header */}
      <header className="border-b-2 border-border bg-secondary-background">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="font-heading text-3xl md:text-4xl font-black text-foreground mb-2">
            Explore Hackathons
          </h1>
          <p className="text-muted-foreground mb-6">
            Discover upcoming hackathons and join the ones that match your skills.
          </p>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search hackathons..."
                className="ps-10"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              {statuses.map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "neutral"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className="capitalize whitespace-nowrap"
                >
                  {s === "all" ? "All" : s}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-52 rounded-base border-2 border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} hackathon{filtered.length > 1 ? "s" : ""} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((h) => (
                <HackathonCard key={h.id} hackathon={h} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 rounded-base border-2 border-dashed border-border">
            <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search || statusFilter !== "all" ? "No hackathons match your filters." : "No hackathons available yet."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
