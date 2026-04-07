import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, Trophy, Target, ArrowLeft, Video, BookOpen } from "lucide-react";

const TYPE_ICON = {
  hackathon: "\u{1F3C6}",
  workshop: "\u{1F6E0}\u{FE0F}",
  seminar: "\u{1F3A4}",
  training: "\u{1F4DA}",
  conference: "\u{1F3AF}",
  other: "\u{2728}",
};

export default function EventPublicPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { currentUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/events/public/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setEvent(data))
      .catch(() => setError("Event not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir={dir}>
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-black text-foreground">Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => navigate("/explore")}>Browse Events</Button>
        </div>
      </div>
    );
  }

  const type = event.eventType || "other";
  const schedule = event.schedule || {};
  const tracks = event.tracks || [];
  const prizes = event.prizes || [];
  const criteria = event.judgingCriteria || [];
  const isRegistrationOpen = ["published", "active"].includes(event.status);
  const isHackathon = type === "hackathon";
  const isWorkshop = type === "workshop" || type === "seminar";
  const isTraining = type === "training";

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      {/* Header */}
      <header className="border-b-2 border-border bg-secondary-background">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate("/explore")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Explore
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{TYPE_ICON[type]}</span>
                <Badge variant="outline" className="capitalize">{type}</Badge>
                <Badge variant="outline" className="capitalize">{event.status}</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-foreground">{event.name}</h1>
              {event.tagline && (
                <p className="mt-2 text-lg text-muted-foreground">{event.tagline}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {isRegistrationOpen && (
                <Button onClick={() => currentUser ? navigate(`/event/${id}/register`) : navigate("/login")}>
                  {isHackathon ? "Register Now" : "RSVP / Register"}
                </Button>
              )}
              {isHackathon && event.status === "active" && currentUser && (
                <Button variant="neutral" onClick={() => navigate(`/event/${id}/submit`)}>
                  Submit Project
                </Button>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-6 mt-6 text-sm text-muted-foreground">
            {schedule.registrationClose && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Registration closes {new Date(schedule.registrationClose).toLocaleDateString()}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {event.registrationCount || 0} registered
            </span>
            {isHackathon && tracks.length > 0 && (
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {tracks.length} track{tracks.length > 1 ? "s" : ""}
              </span>
            )}
            {isWorkshop && event.platform && (
              <span className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                {event.platform}
              </span>
            )}
            {isTraining && event.level && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {event.level}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* Description — all types */}
        {event.description && (
          <section>
            <h2 className="text-xl font-black mb-3">About</h2>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{event.description}</p>
          </section>
        )}

        <Separator />

        {/* Schedule — all types */}
        {Object.values(schedule).some(Boolean) && (
          <section>
            <h2 className="text-xl font-black mb-4">Schedule</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(schedule).map(([key, val]) =>
                val ? (
                  <div key={key} className="rounded-base border-2 border-border p-3">
                    <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                    <p className="font-bold text-foreground">{new Date(val).toLocaleString()}</p>
                  </div>
                ) : null
              )}
            </div>
          </section>
        )}

        {/* Workshop/Seminar-specific: Speaker + Meeting info */}
        {isWorkshop && (event.speaker || event.meetingLink) && (
          <section>
            <h2 className="text-xl font-black mb-4">Session Details</h2>
            <div className="rounded-base border-2 border-border p-4 space-y-2">
              {event.speaker && <p><span className="text-muted-foreground">Speaker:</span> <strong>{event.speaker}</strong></p>}
              {event.capacity && <p><span className="text-muted-foreground">Capacity:</span> {event.capacity} seats</p>}
              {event.platform && <p><span className="text-muted-foreground">Platform:</span> {event.platform}</p>}
            </div>
          </section>
        )}

        {/* Training-specific: Modules + Level */}
        {isTraining && (event.modules?.length > 0 || event.instructor) && (
          <section>
            <h2 className="text-xl font-black mb-4">Training Details</h2>
            <div className="rounded-base border-2 border-border p-4 space-y-2">
              {event.instructor && <p><span className="text-muted-foreground">Instructor:</span> <strong>{event.instructor}</strong></p>}
              {event.level && <p><span className="text-muted-foreground">Level:</span> <span className="capitalize">{event.level}</span></p>}
              {event.duration && <p><span className="text-muted-foreground">Duration:</span> {event.duration}</p>}
              {event.modules?.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2">Modules:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    {event.modules.map((m, i) => (
                      <li key={i} className="text-foreground">{typeof m === "string" ? m : m.name || m.title}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Hackathon-specific: Tracks */}
        {isHackathon && tracks.length > 0 && (
          <section>
            <h2 className="text-xl font-black mb-4">Tracks</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {tracks.map((track, i) => (
                <div key={i} className="rounded-base border-2 border-border p-4">
                  <h3 className="font-bold text-foreground">{track.name}</h3>
                  {track.description && <p className="text-sm text-muted-foreground mt-1">{track.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hackathon-specific: Prizes */}
        {isHackathon && prizes.length > 0 && (
          <section>
            <h2 className="text-xl font-black mb-4">Prizes</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {prizes.map((prize, i) => (
                <div key={i} className="rounded-base border-2 border-border p-4 flex gap-3">
                  <Trophy className="h-5 w-5 shrink-0 text-main mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground">{prize.place && `${prize.place} — `}{prize.title}</p>
                    {prize.value && <p className="text-sm font-bold text-main">{prize.value}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hackathon-specific: Judging Criteria */}
        {isHackathon && criteria.length > 0 && (
          <section>
            <h2 className="text-xl font-black mb-4">Judging Criteria</h2>
            <div className="space-y-2">
              {criteria.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-base border-2 border-border p-3">
                  <span className="font-bold text-foreground">{c.name}</span>
                  <span className="text-sm text-muted-foreground">Weight: {c.weight}%</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rules — all types */}
        {event.rules && (
          <section>
            <h2 className="text-xl font-black mb-3">Rules & Guidelines</h2>
            <div className="rounded-base border-2 border-border p-4">
              <p className="text-foreground whitespace-pre-wrap">{event.rules}</p>
            </div>
          </section>
        )}

        {/* Hackathon action links */}
        {isHackathon && (
          <div className="flex flex-wrap gap-3">
            {currentUser && <Button variant="neutral" onClick={() => navigate(`/event/${id}/teams`)}>Team Formation</Button>}
            <Button variant="neutral" onClick={() => navigate(`/event/${id}/gallery`)}>Project Gallery</Button>
            {currentUser && <Button variant="neutral" onClick={() => navigate(`/event/${id}/workshops`)}>Workshops</Button>}
          </div>
        )}

        {/* CTA */}
        {isRegistrationOpen && (
          <div className="text-center py-8">
            <Button
              size="lg"
              onClick={() => currentUser ? navigate(`/event/${id}/register`) : navigate("/login")}
            >
              {isHackathon ? "Register for this Hackathon" : `Register for this ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
