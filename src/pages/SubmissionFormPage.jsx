import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet, apiPost, apiPatch } from "@/utils/apiClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Send, Save, Upload, FileText, FileArchive, Film, X } from "lucide-react";

export default function SubmissionFormPage() {
  const { slug, id: eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { dir } = useLanguage();

  const [hackathon, setHackathon] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    projectName: "",
    description: "",
    githubUrl: "",
    demoUrl: "",
    videoUrl: "",
    techStack: "",
  });
  const [files, setFiles] = useState([]); // [{ name, url, type }]
  const [uploading, setUploading] = useState(null); // which category is uploading

  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }

    fetch(eventId ? `/api/events/public/${eventId}` : `/api/hackathons/public/${slug}`)
      .then((res) => res.json())
      .then(async (h) => {
        setHackathon(h);
        try {
          const sub = await apiGet(`/api/events/${h.id}/submissions/mine`);
          if (sub.submitted) {
            setExisting(sub);
            setForm({
              projectName: sub.projectName || "",
              description: sub.description || "",
              githubUrl: sub.githubUrl || "",
              demoUrl: sub.demoUrl || "",
              videoUrl: sub.videoUrl || "",
              techStack: (sub.techStack || []).join(", "),
            });
            if (Array.isArray(sub.files)) setFiles(sub.files);
          }
        } catch { /* no existing submission */ }
      })
      .catch(() => setError("Hackathon not found."))
      .finally(() => setLoading(false));
  }, [slug, currentUser, navigate]);

  const handleFileUpload = async (e, category) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = category === "video" ? 200 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File too large. Max ${category === "video" ? "200" : "50"} MB.`);
      return;
    }

    setUploading(category);
    setError(null);
    try {
      const submissionId = existing?.id || "new";
      const { uploadUrl, downloadURL } = await apiPost("/api/upload/presigned-url", {
        fileName: file.name,
        contentType: file.type,
        fileType: "submissions",
        fileId: submissionId,
      });

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const newFile = { name: file.name, url: downloadURL, type: category };
      setFiles((prev) => {
        const filtered = prev.filter((f) => f.type !== category);
        return [...filtered, newFile];
      });
    } catch (err) {
      setError(err.message || "File upload failed.");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const removeFile = (category) => {
    setFiles((prev) => prev.filter((f) => f.type !== category));
  };

  const handleSave = async () => {
    if (!hackathon) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        techStack: form.techStack.split(",").map((s) => s.trim()).filter(Boolean),
        files,
      };

      if (existing) {
        await apiPatch(`/api/events/${hackathon.id}/submissions/${existing.id}`, payload);
      } else {
        const result = await apiPost(`/api/events/${hackathon.id}/submissions`, payload);
        setExisting(result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async () => {
    if (!hackathon || !existing) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiPost(`/api/events/${hackathon.id}/submissions/${existing.id}/submit`);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir={dir}>
        <div className="text-center max-w-md space-y-6">
          <CheckCircle className="h-16 w-16 text-main mx-auto" />
          <h1 className="text-2xl font-black text-foreground">Submission Complete!</h1>
          <p className="text-muted-foreground">Your project has been submitted for review.</p>
          <Button onClick={() => navigate(`/hackathon/${slug}`)}>Back to Hackathon</Button>
        </div>
      </div>
    );
  }

  const isSubmitted = existing?.status === "submitted" || existing?.status === "evaluated";

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(`/hackathon/${slug}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {hackathon?.title}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-black text-foreground">
            {existing ? "Edit Submission" : "Submit Project"}
          </h1>
          {existing && (
            <Badge variant={isSubmitted ? "success" : "outline"} className="capitalize">
              {existing.status}
            </Badge>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              placeholder="Your project name"
              disabled={isSubmitted}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your project, the problem it solves, and how it works..."
              rows={5}
              disabled={isSubmitted}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="githubUrl">GitHub Repository URL</Label>
            <Input
              id="githubUrl"
              type="url"
              value={form.githubUrl}
              onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
              placeholder="https://github.com/username/repo"
              disabled={isSubmitted}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="demoUrl">Live Demo URL</Label>
            <Input
              id="demoUrl"
              type="url"
              value={form.demoUrl}
              onChange={(e) => setForm({ ...form, demoUrl: e.target.value })}
              placeholder="https://your-demo.vercel.app"
              disabled={isSubmitted}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Demo Video URL</Label>
            <Input
              id="videoUrl"
              type="url"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              disabled={isSubmitted}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="techStack">Tech Stack (comma-separated)</Label>
            <Input
              id="techStack"
              value={form.techStack}
              onChange={(e) => setForm({ ...form, techStack: e.target.value })}
              placeholder="React, Node.js, Firebase, Claude API"
              disabled={isSubmitted}
            />
          </div>

          {/* File Uploads */}
          <div className="space-y-3">
            <Label>File Uploads</Label>
            {[
              { category: "presentation", label: "Presentation (PDF/PPTX)", accept: ".pdf,.pptx,.ppt", icon: FileText },
              { category: "code", label: "Source Code (ZIP)", accept: ".zip,.tar.gz,.gz", icon: FileArchive },
              { category: "video", label: "Demo Video", accept: "video/*", icon: Film },
            ].map(({ category, label, accept, icon: Icon }) => {
              const uploaded = files.find((f) => f.type === category);
              const isUploading = uploading === category;
              return (
                <div key={category} className="flex items-center gap-3 rounded-base border-2 border-border bg-background px-4 py-3">
                  <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    {uploaded ? (
                      <div className="flex items-center gap-2">
                        <a href={uploaded.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-main hover:underline truncate">
                          {uploaded.name}
                        </a>
                        {!isSubmitted && (
                          <button type="button" onClick={() => removeFile(category)} className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">{label}</span>
                    )}
                  </div>
                  {!isSubmitted && (
                    <label className={`flex cursor-pointer items-center gap-1 rounded-base border-2 border-border px-3 py-1.5 text-xs font-bold transition-colors hover:bg-card ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
                      <Upload className="h-3 w-3" />
                      {isUploading ? "Uploading..." : uploaded ? "Replace" : "Upload"}
                      <input type="file" accept={accept} className="hidden" onChange={(e) => handleFileUpload(e, category)} disabled={isSubmitted || isUploading} />
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          {!isSubmitted && (
            <div className="flex gap-3">
              <Button type="submit" variant="neutral" disabled={submitting || !form.projectName.trim()}>
                <Save className="h-4 w-4" /> {submitting ? "Saving..." : "Save Draft"}
              </Button>
              {existing && (
                <Button type="button" onClick={handleFinalize} disabled={submitting}>
                  <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit Final"}
                </Button>
              )}
            </div>
          )}

          {isSubmitted && (
            <p className="text-sm text-muted-foreground italic">
              This submission has been finalized and cannot be edited.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
