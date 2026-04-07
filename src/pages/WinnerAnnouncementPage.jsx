import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Star, ExternalLink, Code, Sparkles } from "lucide-react";

const MEDAL_COLORS = {
  1: "bg-amber-400 text-black",
  2: "bg-gray-300 text-black",
  3: "bg-amber-700 text-white",
};

export default function WinnerAnnouncementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const [event, setEvent] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/events/public/${id}`).then((r) => r.json()),
      fetch(`/api/events/${id}/leaderboard`).then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([e, lb]) => {
      setEvent(e);
      setLeaderboard(lb.data || []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const winners = leaderboard.filter((p) => p.totalScore != null).slice(0, 10);
  const top3 = winners.slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      {/* Header */}
      <header className="border-b-2 border-border bg-secondary-background">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <button
            onClick={() => navigate(`/event/${id}`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 mx-auto w-fit"
          >
            <ArrowLeft className="h-4 w-4" /> Back to {event?.name || "Event"}
          </button>

          <Sparkles className="h-10 w-10 text-main mx-auto mb-4" />
          <h1 className="font-heading text-3xl md:text-4xl font-black text-foreground mb-2">
            {event?.status === "completed" ? "Winners Announced!" : "Leaderboard"}
          </h1>
          <p className="text-muted-foreground">
            {event?.name}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Top 3 podium */}
        {top3.length > 0 && (
          <div className="flex flex-col sm:flex-row items-end justify-center gap-4 mb-12">
            {/* 2nd place */}
            {top3[1] && (
              <div className="order-1 sm:order-1 flex-1 max-w-xs text-center">
                <div className="rounded-base border-2 border-border bg-card p-5 shadow-shadow">
                  <div className={`mx-auto w-12 h-12 rounded-full ${MEDAL_COLORS[2]} flex items-center justify-center font-black text-xl mb-3`}>2</div>
                  <h3 className="font-black text-foreground">{top3[1].projectName}</h3>
                  <p className="text-2xl font-black text-main mt-1">{Math.round(top3[1].totalScore)}</p>
                </div>
              </div>
            )}

            {/* 1st place (tallest) */}
            {top3[0] && (
              <div className="order-0 sm:order-2 flex-1 max-w-xs text-center">
                <div className="rounded-base border-2 border-main bg-main/5 p-6 shadow-shadow relative">
                  <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <div className={`mx-auto w-14 h-14 rounded-full ${MEDAL_COLORS[1]} flex items-center justify-center font-black text-2xl mb-3 shadow-neo-sm`}>1</div>
                  <h3 className="font-black text-foreground text-lg">{top3[0].projectName}</h3>
                  <p className="text-3xl font-black text-main mt-1">{Math.round(top3[0].totalScore)}</p>
                  {top3[0].githubUrl && (
                    <a href={top3[0].githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-main mt-2 hover:underline">
                      <Code className="h-3 w-3" /> GitHub
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* 3rd place */}
            {top3[2] && (
              <div className="order-2 sm:order-3 flex-1 max-w-xs text-center">
                <div className="rounded-base border-2 border-border bg-card p-5 shadow-shadow">
                  <div className={`mx-auto w-12 h-12 rounded-full ${MEDAL_COLORS[3]} flex items-center justify-center font-black text-xl mb-3`}>3</div>
                  <h3 className="font-black text-foreground">{top3[2].projectName}</h3>
                  <p className="text-2xl font-black text-main mt-1">{Math.round(top3[2].totalScore)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full leaderboard */}
        {winners.length > 3 && (
          <div className="space-y-2">
            <h2 className="text-xl font-black mb-4">Full Rankings</h2>
            {winners.slice(3).map((project) => (
              <div key={project.id} className="flex items-center gap-4 rounded-base border-2 border-border bg-card p-4">
                <span className="text-sm font-black text-muted-foreground w-8 text-center">#{project.rank}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{project.projectName}</h3>
                  {project.techStack?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.techStack.slice(0, 4).map((t, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-lg font-black text-main">{Math.round(project.totalScore)}</span>
                <div className="flex gap-2">
                  {project.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-main">
                      <Code className="h-4 w-4" />
                    </a>
                  )}
                  {project.demoUrl && (
                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-main">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {winners.length === 0 && (
          <div className="text-center py-16 rounded-base border-2 border-dashed border-border">
            <Star className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No scores available yet. Winners will be announced here.</p>
          </div>
        )}
      </main>
    </div>
  );
}
