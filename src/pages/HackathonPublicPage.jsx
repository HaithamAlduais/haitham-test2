import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, Trophy, Target, ArrowLeft } from "lucide-react";

function CountdownTimer({ targetDate, label }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) { setTimeLeft("Ended"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${d}d ${h}h ${m}m`);
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);
  return (
    <div className="inline-flex items-center gap-2 rounded-base border-2 border-main bg-main/10 px-3 py-1.5 text-sm font-bold text-main">
      <span>⏰</span> {label}: {timeLeft}
    </div>
  );
}

export default function HackathonPublicPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { currentUser } = useAuth();
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/hackathons/public/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setHackathon(data))
      .catch(() => setError("Hackathon not found."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !hackathon) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir={dir}>
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-black text-foreground">Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const schedule = hackathon.schedule || {};
  const tracks = hackathon.tracks || [];
  const prizes = hackathon.prizes || [];
  const criteria = hackathon.judgingCriteria || [];
  const isRegistrationOpen = ["published", "active"].includes(hackathon.status);

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      {/* Header */}
      <header className="border-b-2 border-border bg-secondary-background">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="outline" className="mb-2 capitalize">{hackathon.status}</Badge>
              <h1 className="text-3xl md:text-4xl font-black text-foreground">{hackathon.title}</h1>
              {hackathon.tagline && (
                <p className="mt-2 text-lg text-muted-foreground">{hackathon.tagline}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {isRegistrationOpen && (
                <Button
                  onClick={() => currentUser ? navigate(`/hackathon/${slug}/register`) : navigate("/login")}
                >
                  Register Now
                </Button>
              )}
              {hackathon.status === "active" && currentUser && (
                <Button variant="neutral" onClick={() => navigate(`/hackathon/${slug}/submit`)}>
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
              {hackathon.registrationCount || 0} registered
            </span>
            {tracks.length > 0 && (
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {tracks.length} track{tracks.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Countdown */}
          {schedule.submissionDeadline && new Date(schedule.submissionDeadline) > new Date() && (
            <div className="mt-4">
              <CountdownTimer targetDate={schedule.submissionDeadline} label="Submission deadline" />
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* Description */}
        {hackathon.description && (
          <section>
            <h2 className="text-xl font-black mb-3">About</h2>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{hackathon.description}</p>
          </section>
        )}

        <Separator />

        {/* Schedule */}
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

        {/* Tracks */}
        {tracks.length > 0 && (
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

        {/* Prizes */}
        {prizes.length > 0 && (
          <section>
            <h2 className="text-xl font-black mb-4">Prizes</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {prizes.map((prize, i) => (
                <div key={i} className="rounded-base border-2 border-border p-4 flex gap-3">
                  <Trophy className="h-5 w-5 shrink-0 text-main mt-0.5" />
                  <div>
                    <p className="font-bold text-foreground">{prize.place && `${prize.place} — `}{prize.title}</p>
                    {prize.value && <p className="text-sm font-bold text-main">{prize.value}</p>}
                    {prize.description && <p className="text-sm text-muted-foreground mt-1">{prize.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Judging Criteria */}
        {criteria.length > 0 && (
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

        {/* Rules */}
        {hackathon.rules && (
          <section>
            <h2 className="text-xl font-black mb-3">Rules & Code of Conduct</h2>
            <div className="rounded-base border-2 border-border p-4">
              <p className="text-foreground whitespace-pre-wrap">{hackathon.rules}</p>
            </div>
          </section>
        )}

        {/* Sponsors */}
        {hackathon.sponsors?.length > 0 && (
          <section>
            <h2 className="text-xl font-black mb-4">Sponsors & Partners</h2>
            <div className="flex flex-wrap gap-6 items-center justify-center">
              {hackathon.sponsors.map((s, i) => (
                <div key={i} className="text-center">
                  {s.logoUrl ? (
                    <img src={s.logoUrl} alt={s.name} className="h-12 object-contain mx-auto" />
                  ) : (
                    <div className="h-12 w-24 rounded-base border-2 border-border flex items-center justify-center text-xs font-bold text-muted-foreground bg-card">{s.name}</div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{s.tier}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Resources */}
        {hackathon.resources?.length > 0 && (
          <section>
            <h2 className="text-xl font-black mb-4">Resources</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {hackathon.resources.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-base border-2 border-border p-3 hover:border-main transition-colors">
                  <span className="text-lg">{r.type === "dataset" ? "📊" : r.type === "api_doc" ? "📖" : r.type === "tool" ? "🔧" : r.type === "credits" ? "💳" : "📄"}</span>
                  <div>
                    <p className="font-bold text-foreground text-sm">{r.title}</p>
                    {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        {hackathon.faq?.length > 0 && (
          <section>
            <h2 className="text-xl font-black mb-4">FAQ</h2>
            <div className="space-y-3">
              {hackathon.faq.map((item, i) => (
                <details key={i} className="rounded-base border-2 border-border p-4 group">
                  <summary className="font-bold text-foreground cursor-pointer list-none flex items-center justify-between">
                    {item.question}
                    <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        {isRegistrationOpen && (
          <div className="text-center py-8">
            <Button
              size="lg"
              onClick={() => currentUser ? navigate(`/hackathon/${slug}/register`) : navigate("/login")}
            >
              Register for this Hackathon
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
