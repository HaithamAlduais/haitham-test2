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

const TYPE_ICON = {
  hackathon: "\u{1F3C6}",
  workshop: "\u{1F6E0}\u{FE0F}",
  seminar: "\u{1F3A4}",
  training: "\u{1F4DA}",
  conference: "\u{1F3AF}",
  other: "\u{2728}",
};

function EventCard({ event }) {
  const navigate = useNavigate();
  const tracks = event.tracks || [];
  const type = event.eventType || "other";

  return (
    <button
      onClick={() => navigate(`/event/${event.id}`)}
      className="w-full text-start rounded-base border-2 border-border bg-card p-5 shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all duration-100 group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{TYPE_ICON[type] || TYPE_ICON.other}</span>
          <Badge variant={STATUS_VARIANT[event.status] || "outline"} className="capitalize">
            {event.status}
          </Badge>
        </div>
        <Badge variant="outline" className="capitalize text-[10px]">{type}</Badge>
      </div>
      <h3 className="font-heading font-black text-lg text-foreground leading-tight mb-1">{event.name}</h3>
      {event.tagline && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.tagline}</p>
      )}
      {tracks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tracks.slice(0, 3).map((t, i) => (
            <Badge key={i} variant="outline" className="text-[10px]">{t.name}</Badge>
          ))}
        </div>
      )}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        {event.schedule?.registrationOpen && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(event.schedule.registrationOpen).toLocaleDateString()}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {event.registrationCount || 0} registered
        </span>
      </div>
      <span className="flex items-center gap-1 text-xs font-bold text-main group-hover:underline">
        View Details <ArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}

const EVENT_TYPES = ["all", "hackathon", "workshop", "seminar", "training", "conference"];
const STATUSES = ["all", "published", "active", "judging", "completed"];

export default function ExplorePage() {
  const { dir } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetch("/api/events/public")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        console.log("[Explore] Loaded events:", json.data?.length || 0);
        setEvents(json.data || []);
      })
      .catch((err) => {
        console.error("[Explore] Failed to load events:", err);
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter((e) => {
    const matchesSearch =
      !search ||
      (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.tagline || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || e.eventType === typeFilter;
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <header className="border-b-2 border-border bg-secondary-background">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="font-heading text-3xl md:text-4xl font-black text-foreground mb-2">
            Explore Events
          </h1>
          <p className="text-muted-foreground mb-6">
            Discover hackathons, workshops, seminars, training programs, and conferences.
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="ps-10"
            />
          </div>

          {/* Type filter */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="text-xs font-bold text-muted-foreground uppercase self-center me-1">Type:</span>
            {EVENT_TYPES.map((t) => (
              <Button
                key={t}
                variant={typeFilter === t ? "default" : "neutral"}
                size="sm"
                onClick={() => setTypeFilter(t)}
                className="capitalize whitespace-nowrap"
              >
                {t === "all" ? "All Types" : `${TYPE_ICON[t] || ""} ${t}`}
              </Button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase self-center me-1">Status:</span>
            {STATUSES.map((s) => (
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
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-52 rounded-base border-2 border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} event{filtered.length > 1 ? "s" : ""} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 rounded-base border-2 border-dashed border-border">
            <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {search || typeFilter !== "all" || statusFilter !== "all"
                ? "No events match your filters."
                : "No events available yet."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
