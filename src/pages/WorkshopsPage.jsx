import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet, apiPost } from "@/utils/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Video, Users, ExternalLink } from "lucide-react";

export default function WorkshopsListPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { dir } = useLanguage();
  const [hackathon, setHackathon] = useState(null);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(null);

  useEffect(() => {
    fetch(`/api/hackathons/public/${slug}`)
      .then((res) => res.json())
      .then(async (h) => {
        setHackathon(h);
        if (currentUser) {
          try {
            const data = await apiGet(`/api/hackathons/${h.id}/workshops`);
            setWorkshops(data.data || []);
          } catch { /* not authorized */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, currentUser]);

  const handleRsvp = async (workshopId) => {
    if (!hackathon) return;
    setRsvpLoading(workshopId);
    try {
      await apiPost(`/api/hackathons/${hackathon.id}/workshops/${workshopId}/rsvp`);
      setWorkshops((prev) =>
        prev.map((w) =>
          w.id === workshopId
            ? { ...w, attendees: [...(w.attendees || []), currentUser.uid] }
            : w
        )
      );
    } catch { /* silently fail */ }
    setRsvpLoading(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(`/hackathon/${slug}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {hackathon?.title || "Hackathon"}
        </button>

        <h1 className="font-heading text-2xl font-black text-foreground mb-6">Workshops</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-base border-2 border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : !currentUser ? (
          <div className="text-center py-12 rounded-base border-2 border-dashed border-border">
            <p className="text-muted-foreground mb-4">Log in to view workshops.</p>
            <Button onClick={() => navigate("/login")}>Log In</Button>
          </div>
        ) : workshops.length === 0 ? (
          <div className="text-center py-12 rounded-base border-2 border-dashed border-border">
            <p className="text-muted-foreground">No workshops scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workshops.map((w) => {
              const isRsvpd = (w.attendees || []).includes(currentUser.uid);
              const isPast = w.dateTime && new Date(w.dateTime) < new Date();

              return (
                <div key={w.id} className="rounded-base border-2 border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{w.title}</h3>
                      {w.description && (
                        <p className="text-sm text-muted-foreground mt-1">{w.description}</p>
                      )}
                    </div>
                    <Badge variant={isPast ? "secondary" : "success"}>
                      {isPast ? "Past" : "Upcoming"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    {w.dateTime && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(w.dateTime).toLocaleString()}
                      </span>
                    )}
                    {w.durationMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {w.durationMinutes} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      {w.platform || "zoom"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {(w.attendees || []).length} RSVP'd
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {!isPast && !isRsvpd && (
                      <Button size="sm" onClick={() => handleRsvp(w.id)} disabled={rsvpLoading === w.id}>
                        {rsvpLoading === w.id ? "..." : "RSVP"}
                      </Button>
                    )}
                    {isRsvpd && <Badge variant="success">RSVP'd</Badge>}
                    {w.meetingLink && (
                      <a href={w.meetingLink} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="neutral">
                          <ExternalLink className="h-3 w-3" /> Join
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
