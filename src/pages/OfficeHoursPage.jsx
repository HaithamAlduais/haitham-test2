import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Video,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
} from "lucide-react";

const PLATFORM_LABELS = {
  zoom: "Zoom",
  meet: "Google Meet",
  teams: "MS Teams",
  discord: "Discord",
  other: "Other",
};

export default function OfficeHoursPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { token, currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(null);

  useEffect(() => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(`/api/hackathons/${id}/office-hours`, { headers })
      .then((r) => r.json())
      .then((d) => setSessions(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleRsvp = async (ohId) => {
    if (!token) return;
    setRsvpLoading(ohId);
    try {
      const res = await fetch(`/api/hackathons/${id}/office-hours/${ohId}/rsvp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // Optimistically add user to RSVPs
        setSessions((prev) =>
          prev.map((s) =>
            s.id === ohId
              ? { ...s, rsvps: [...(s.rsvps || []), currentUser.uid] }
              : s
          )
        );
      }
    } catch {
      // ignore
    } finally {
      setRsvpLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <header className="border-b-2 border-border bg-secondary-background">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <button
            onClick={() => navigate(`/event/${id}`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 mx-auto w-fit"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Event
          </button>
          <Video className="h-10 w-10 text-main mx-auto mb-4" />
          <h1 className="font-heading text-3xl font-black text-foreground mb-2">
            Office Hours
          </h1>
          <p className="text-muted-foreground">
            Drop-in sessions with mentors and organizers
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {sessions.length === 0 && (
          <div className="text-center py-16 rounded-base border-2 border-dashed border-border">
            <Video className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No office hours scheduled yet. Check back later.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map((session) => {
            const hasRsvped =
              currentUser && (session.rsvps || []).includes(currentUser.uid);
            const rsvpCount = (session.rsvps || []).length;

            return (
              <div
                key={session.id}
                className="rounded-base border-2 border-border bg-card p-5 shadow-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-black text-foreground text-lg">
                    {session.title}
                  </h3>
                  <Badge variant="neutral" className="text-xs flex-shrink-0">
                    {PLATFORM_LABELS[session.platform] || session.platform}
                  </Badge>
                </div>

                {session.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {session.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                  {session.dateTime && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(session.dateTime).toLocaleDateString()}
                    </span>
                  )}
                  {session.dateTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(session.dateTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  {session.durationMinutes && (
                    <span>{session.durationMinutes} min</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {rsvpCount} RSVP
                    {rsvpCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {session.meetingLink && (
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="noShadow" size="sm">
                        <Video className="h-4 w-4 mr-1" /> Join
                      </Button>
                    </a>
                  )}

                  {currentUser && !hasRsvped && (
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() => handleRsvp(session.id)}
                      disabled={rsvpLoading === session.id}
                    >
                      {rsvpLoading === session.id ? "..." : "RSVP"}
                    </Button>
                  )}

                  {hasRsvped && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="h-4 w-4" /> RSVP'd
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
