import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet, apiPost } from "@/utils/apiClient";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Star, CheckCircle, ExternalLink } from "lucide-react";

function SubmissionCard({ submission, scored, onSelect }) {
  return (
    <button
      onClick={() => onSelect(submission)}
      className="w-full text-start rounded-base border-2 border-border bg-card p-4 hover:shadow-shadow transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-foreground">{submission.projectName}</h3>
        {scored ? (
          <Badge variant="success">Scored</Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        )}
      </div>
      {submission.description && (
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{submission.description}</p>
      )}
      {submission.techStack?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {submission.techStack.slice(0, 5).map((t, i) => (
            <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
          ))}
        </div>
      )}
    </button>
  );
}

export default function JudgePortalPage() {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { dir } = useLanguage();

  const [hackathon, setHackathon] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [myScores, setMyScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [criteriaScores, setCriteriaScores] = useState({});
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [leaderboard, scores] = await Promise.all([
        apiGet(`/api/hackathons/${hackathonId}/leaderboard`),
        apiGet(`/api/hackathons/${hackathonId}/scores/mine`),
      ]);
      setSubmissions(leaderboard.data || []);
      setMyScores(scores.data || []);

      // Fetch hackathon info from public endpoint
      // We need the judging criteria
      const allHackathons = await fetch(`/api/hackathons/public`).then(r => r.json());
      const h = (allHackathons.data || []).find(x => x.id === hackathonId);
      if (h) {
        // Need full data, fetch by slug
        const full = await fetch(`/api/hackathons/public/${h.slug}`).then(r => r.json());
        setHackathon(full);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [hackathonId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isScored = (subId) => myScores.some((s) => s.submissionId === subId);

  const handleSelect = (sub) => {
    setSelected(sub);
    setError(null);
    // Pre-fill if already scored
    const existing = myScores.find((s) => s.submissionId === sub.id);
    if (existing) {
      setCriteriaScores(existing.criteriaScores || {});
      setFeedback(existing.feedback || "");
    } else {
      setCriteriaScores({});
      setFeedback("");
    }
  };

  const handleSubmitScore = async () => {
    if (!selected) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiPost(`/api/hackathons/${hackathonId}/scores`, {
        submissionId: selected.id,
        criteriaScores,
        feedback,
      });
      await fetchData();
      setSelected(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const criteria = hackathon?.judgingCriteria || [];
  const scoredCount = submissions.filter((s) => isScored(s.id)).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePath="/dashboard/judge">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-black text-foreground">Judge Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {scoredCount}/{submissions.length} submissions scored
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Submission list */}
        <div className="space-y-3">
          <h2 className="font-bold text-foreground">Submissions</h2>
          {submissions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No submissions to review.</p>
          ) : (
            submissions.map((sub) => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                scored={isScored(sub.id)}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>

        {/* Right: Scoring form */}
        <div>
          {selected ? (
            <div className="rounded-base border-2 border-border bg-card p-5 space-y-5 sticky top-4">
              <div>
                <h2 className="font-black text-lg text-foreground">{selected.projectName}</h2>
                {selected.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
                )}
                <div className="flex gap-3 mt-3">
                  {selected.githubUrl && (
                    <a href={selected.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-main flex items-center gap-1 hover:underline">
                      <ExternalLink className="h-3 w-3" /> GitHub
                    </a>
                  )}
                  {selected.demoUrl && (
                    <a href={selected.demoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-main flex items-center gap-1 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Demo
                    </a>
                  )}
                  {selected.videoUrl && (
                    <a href={selected.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-main flex items-center gap-1 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Video
                    </a>
                  )}
                </div>
              </div>

              <Separator />

              {/* Criteria scoring */}
              <div className="space-y-4">
                {criteria.length > 0 ? (
                  criteria.map((c) => (
                    <div key={c.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">{c.name} ({c.weight}%)</Label>
                        <span className="text-sm font-bold text-main">
                          {criteriaScores[c.name] || 0}/{c.maxScore || 5}
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={c.maxScore || 5}
                        step={1}
                        value={[criteriaScores[c.name] || 0]}
                        onValueChange={([val]) =>
                          setCriteriaScores({ ...criteriaScores, [c.name]: val })
                        }
                      />
                    </div>
                  ))
                ) : (
                  <div className="space-y-2">
                    <Label>Overall Score (0-10)</Label>
                    <Slider
                      min={0}
                      max={10}
                      step={1}
                      value={[criteriaScores.overall || 0]}
                      onValueChange={([val]) =>
                        setCriteriaScores({ overall: val })
                      }
                    />
                    <p className="text-sm text-muted-foreground text-end">{criteriaScores.overall || 0}/10</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Feedback (optional)</Label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Comments for the team..."
                  rows={3}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSubmitScore} disabled={submitting}>
                  <Star className="h-4 w-4" />
                  {submitting ? "Saving..." : isScored(selected.id) ? "Update Score" : "Submit Score"}
                </Button>
                <Button variant="neutral" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-base border-2 border-dashed border-border p-8 text-center">
              <Star className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Select a submission to start scoring</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
