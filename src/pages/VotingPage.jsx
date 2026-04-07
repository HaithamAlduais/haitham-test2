import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet, apiPost } from "@/utils/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Trophy, ExternalLink, Share2 } from "lucide-react";

function ProjectVoteCard({ project, myVote, onVote, voting }) {
  const isVoted = myVote === project.submissionId;

  return (
    <div
      className={`rounded-base border-2 p-5 transition-all ${
        isVoted
          ? "border-main bg-main/5 shadow-neo-sm"
          : "border-border bg-card hover:border-main/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-lg">{project.projectName}</h3>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
          )}
          {project.techStack?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {project.techStack.map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="text-center shrink-0">
          <div className="text-2xl font-black text-main">{project.voteCount || 0}</div>
          <div className="text-xs text-muted-foreground">votes</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <Button
          onClick={() => onVote(project.submissionId)}
          disabled={voting}
          variant={isVoted ? "default" : "neutral"}
          size="sm"
          className="gap-1.5"
        >
          <Heart className={`h-4 w-4 ${isVoted ? "fill-current" : ""}`} />
          {isVoted ? "Voted" : "Vote"}
        </Button>

        {project.demoUrl && (
          <a
            href={project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-main hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Demo
          </a>
        )}
        {project.githubUrl && (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Code
          </a>
        )}

        <button
          onClick={() => {
            const url = `${window.location.origin}${window.location.pathname}`;
            navigator.clipboard?.writeText(url);
          }}
          className="ml-auto text-muted-foreground hover:text-foreground"
          title="Share voting page"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function VotingPage() {
  const { slug, id: eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { dir } = useLanguage();

  const [hackathon, setHackathon] = useState(null);
  const [projects, setProjects] = useState([]);
  const [myVote, setMyVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        // Fetch hackathon info
        const h = eventId
          ? await fetch(`/api/events/public/${eventId}`).then((r) => r.json())
          : await fetch(`/api/hackathons/public/${slug}`).then((r) => r.json());
        setHackathon(h);

        // Fetch vote results
        const results = await apiGet(`/api/hackathons/${h.id}/votes/results`);
        setProjects(results.data || []);

        // Fetch my vote
        if (currentUser) {
          const mine = await apiGet(`/api/hackathons/${h.id}/votes/mine`);
          if (mine.voted) setMyVote(mine.submissionId);
        }
      } catch (err) {
        setError("Could not load voting data. Make sure you're logged in.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, eventId, currentUser]);

  const handleVote = async (submissionId) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setVoting(true);
    try {
      await apiPost(`/api/hackathons/${hackathon.id}/votes`, { submissionId });
      setMyVote(submissionId);
      // Refresh results
      const results = await apiGet(`/api/hackathons/${hackathon.id}/votes/results`);
      setProjects(results.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setVoting(false);
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
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-6 w-6 text-main" />
            <h1 className="text-2xl font-black text-foreground">Popular Choice Voting</h1>
          </div>
          {hackathon && (
            <p className="text-muted-foreground">
              Vote for your favorite project in <strong>{hackathon.title}</strong>. You can vote for one project (you can change your vote).
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!currentUser && (
          <div className="mb-6 rounded-base border-2 border-border bg-card p-4 text-center">
            <p className="text-muted-foreground mb-3">You need to be logged in to vote.</p>
            <Button onClick={() => navigate("/login")}>Log In to Vote</Button>
          </div>
        )}

        {projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project, idx) => (
              <div key={project.submissionId} className="relative">
                {idx < 3 && (
                  <div className="absolute -left-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-border bg-main text-xs font-black text-main-foreground shadow-neo-sm">
                    {idx + 1}
                  </div>
                )}
                <ProjectVoteCard
                  project={project}
                  myVote={myVote}
                  onVote={handleVote}
                  voting={voting}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-base border-2 border-dashed border-border">
            <p className="text-muted-foreground">No submitted projects yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
