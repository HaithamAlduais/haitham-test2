import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, ArrowLeft, Trophy, Code } from "lucide-react";

function ProjectCard({ project, rank }) {
  return (
    <div className="rounded-base border-2 border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {rank <= 3 && (
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
              rank === 1 ? "bg-amber-400 text-black" : rank === 2 ? "bg-gray-300 text-black" : "bg-amber-700 text-white"
            }`}>
              {rank}
            </div>
          )}
          <h3 className="font-bold text-foreground">{project.projectName}</h3>
        </div>
        {project.totalScore != null && (
          <Badge variant="outline" className="shrink-0">
            Score: {Math.round(project.totalScore)}
          </Badge>
        )}
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
      )}

      {project.techStack?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.techStack.map((t, i) => (
            <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
          ))}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        {project.githubUrl && (
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-main flex items-center gap-1 hover:underline">
            <Code className="h-3 w-3" /> GitHub
          </a>
        )}
        {project.demoUrl && (
          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-main flex items-center gap-1 hover:underline">
            <ExternalLink className="h-3 w-3" /> Demo
          </a>
        )}
        {project.videoUrl && (
          <a href={project.videoUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-main flex items-center gap-1 hover:underline">
            <ExternalLink className="h-3 w-3" /> Video
          </a>
        )}
      </div>
    </div>
  );
}

export default function ProjectGalleryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const [hackathon, setHackathon] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/hackathons/public/${slug}`)
      .then((res) => res.json())
      .then(async (h) => {
        setHackathon(h);
        try {
          const res = await fetch(`/api/hackathons/${h.id}/leaderboard`);
          const data = await res.json();
          setProjects(data.data || []);
        } catch { /* no leaderboard access without auth */ }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const filtered = projects.filter((p) =>
    !search ||
    p.projectName?.toLowerCase().includes(search.toLowerCase()) ||
    (p.techStack || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(`/hackathon/${slug}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {hackathon?.title || "Hackathon"}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-6 w-6 text-main" />
          <h1 className="font-heading text-2xl font-black text-foreground">Project Gallery</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name or tech stack..."
            className="ps-10"
          />
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 rounded-base border-2 border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} rank={project.rank || 999} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-base border-2 border-dashed border-border">
            <p className="text-muted-foreground">
              {search ? "No projects match your search." : "No projects submitted yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
