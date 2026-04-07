import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Trophy,
  Users,
  Code,
  ExternalLink,
  Layers,
  Award,
  BarChart3,
  ThumbsUp,
  Copy,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const MEDAL_COLORS = {
  1: "bg-amber-400 text-black",
  2: "bg-gray-300 text-black",
  3: "bg-amber-700 text-white",
};

export default function EventLegacyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { currentUser, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    fetch(`/api/hackathons/${id}/legacy`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleClone = async () => {
    if (!token) return;
    setCloning(true);
    try {
      const res = await fetch(`/api/hackathons/${id}/legacy/clone`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.id) {
        navigate(`/hackathons/${result.id}`);
      }
    } catch {
      // ignore
    } finally {
      setCloning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  const { event, stats, winners, allProjects } = data;
  const brandBg = event.branding?.primaryColor || undefined;

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      {/* Hero */}
      <header
        className="border-b-2 border-border"
        style={brandBg ? { backgroundColor: brandBg + "15" } : undefined}
      >
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <button
            onClick={() => navigate(`/event/${id}`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 mx-auto w-fit"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Event
          </button>

          <Award className="h-10 w-10 text-main mx-auto mb-4" />
          <h1 className="font-heading text-3xl md:text-4xl font-black text-foreground mb-2">
            {event.title}
          </h1>
          {event.tagline && (
            <p className="text-lg text-muted-foreground mb-4">{event.tagline}</p>
          )}
          <Badge variant="neutral" className="text-xs">
            Legacy Archive
          </Badge>

          {currentUser && (
            <div className="mt-6">
              <Button
                variant="noShadow"
                size="sm"
                onClick={handleClone}
                disabled={cloning}
              >
                <Copy className="h-4 w-4 mr-1" />
                {cloning ? "Cloning..." : "Clone as Template"}
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Registrations", value: stats.registrations, icon: Users },
            { label: "Teams", value: stats.teams, icon: Layers },
            { label: "Submissions", value: stats.submissions, icon: Code },
            { label: "Scores Given", value: stats.scores, icon: BarChart3 },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-base border-2 border-border bg-card p-4 text-center shadow-shadow"
            >
              <s.icon className="h-6 w-6 text-main mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Winners Podium */}
        {winners.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" /> Winners
            </h2>
            <div className="flex flex-col sm:flex-row items-end justify-center gap-4">
              {/* 2nd place */}
              {winners[1] && (
                <div className="order-1 sm:order-1 flex-1 max-w-xs text-center">
                  <div className="rounded-base border-2 border-border bg-card p-5 shadow-shadow">
                    <div
                      className={`mx-auto w-12 h-12 rounded-full ${MEDAL_COLORS[2]} flex items-center justify-center font-black text-xl mb-3`}
                    >
                      2
                    </div>
                    <h3 className="font-black text-foreground">{winners[1].projectName}</h3>
                    {winners[1].totalScore != null && (
                      <p className="text-2xl font-black text-main mt-1">
                        {Math.round(winners[1].totalScore)}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {/* 1st place */}
              {winners[0] && (
                <div className="order-0 sm:order-2 flex-1 max-w-xs text-center">
                  <div className="rounded-base border-2 border-main bg-main/5 p-6 shadow-shadow relative">
                    <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <div
                      className={`mx-auto w-14 h-14 rounded-full ${MEDAL_COLORS[1]} flex items-center justify-center font-black text-2xl mb-3 shadow-neo-sm`}
                    >
                      1
                    </div>
                    <h3 className="font-black text-foreground text-lg">
                      {winners[0].projectName}
                    </h3>
                    {winners[0].totalScore != null && (
                      <p className="text-3xl font-black text-main mt-1">
                        {Math.round(winners[0].totalScore)}
                      </p>
                    )}
                    <div className="flex justify-center gap-3 mt-2">
                      {winners[0].githubUrl && (
                        <a
                          href={winners[0].githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-main hover:underline text-xs inline-flex items-center gap-1"
                        >
                          <Code className="h-3 w-3" /> GitHub
                        </a>
                      )}
                      {winners[0].demoUrl && (
                        <a
                          href={winners[0].demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-main hover:underline text-xs inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Demo
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* 3rd place */}
              {winners[2] && (
                <div className="order-2 sm:order-3 flex-1 max-w-xs text-center">
                  <div className="rounded-base border-2 border-border bg-card p-5 shadow-shadow">
                    <div
                      className={`mx-auto w-12 h-12 rounded-full ${MEDAL_COLORS[3]} flex items-center justify-center font-black text-xl mb-3`}
                    >
                      3
                    </div>
                    <h3 className="font-black text-foreground">{winners[2].projectName}</h3>
                    {winners[2].totalScore != null && (
                      <p className="text-2xl font-black text-main mt-1">
                        {Math.round(winners[2].totalScore)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tracks */}
        {event.tracks?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-black mb-4">Tracks</h2>
            <div className="flex flex-wrap gap-2">
              {event.tracks.map((t, i) => (
                <Badge key={i} variant="neutral">
                  {typeof t === "string" ? t : t.name}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Prizes */}
        {event.prizes?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-black mb-4">Prizes</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {event.prizes.map((p, i) => (
                <div
                  key={i}
                  className="rounded-base border-2 border-border bg-card p-4 shadow-shadow"
                >
                  <h3 className="font-bold text-foreground">{p.title || p.name}</h3>
                  {p.value && (
                    <p className="text-lg font-black text-main">${p.value}</p>
                  )}
                  {p.description && (
                    <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Projects Gallery */}
        {allProjects.length > 0 && (
          <section>
            <h2 className="text-xl font-black mb-4">All Projects</h2>
            <div className="space-y-2">
              {allProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-4 rounded-base border-2 border-border bg-card p-4"
                >
                  <span className="text-sm font-black text-muted-foreground w-8 text-center">
                    #{project.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate">
                      {project.projectName}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {project.description}
                      </p>
                    )}
                    {project.techStack?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.techStack.slice(0, 4).map((t, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {project.totalScore != null && (
                    <span className="text-lg font-black text-main">
                      {Math.round(project.totalScore)}
                    </span>
                  )}
                  {project.voteCount > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" /> {project.voteCount}
                    </span>
                  )}
                  <div className="flex gap-2">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-main"
                      >
                        <Code className="h-4 w-4" />
                      </a>
                    )}
                    {project.demoUrl && (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-main"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {allProjects.length === 0 && (
          <div className="text-center py-16 rounded-base border-2 border-dashed border-border">
            <Code className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No project submissions recorded for this event.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
