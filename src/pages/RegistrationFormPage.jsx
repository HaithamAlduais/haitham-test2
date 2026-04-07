import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet, apiPost } from "@/utils/apiClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function RegistrationFormPage() {
  const { slug, id: eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { dir } = useLanguage();

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState(null);
  const [formResponses, setFormResponses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Fetch event by ID or slug
    const fetchUrl = eventId ? `/api/events/public/${eventId}` : `/api/hackathons/public/${slug}`;
    fetch(fetchUrl)
      .then((res) => res.json())
      .then(async (h) => {
        setHackathon(h);
        // Check existing registration
        try {
          const reg = await apiGet(`/api/events/${h.id}/registrations/mine`);
          if (reg.registered) setExisting(reg);
        } catch {
          // Not registered yet
        }
      })
      .catch(() => setError("Hackathon not found."))
      .finally(() => setLoading(false));
  }, [slug, currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hackathon) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiPost(`/api/events/${hackathon.id}/registrations`, { formResponses });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Registration failed.");
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
          <h1 className="text-2xl font-black text-foreground">Registration Submitted!</h1>
          <p className="text-muted-foreground">
            {hackathon?.registrationSettings?.requireApproval !== false
              ? "Your application is pending review. You'll be notified once it's approved."
              : "You're registered! Check your dashboard for next steps."}
          </p>
          <Button onClick={() => navigate(`/hackathon/${slug}`)}>Back to Hackathon</Button>
        </div>
      </div>
    );
  }

  if (existing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir={dir}>
        <div className="text-center max-w-md space-y-6">
          <h1 className="text-2xl font-black text-foreground">Already Registered</h1>
          <p className="text-muted-foreground">
            Your registration status: <strong className="capitalize">{existing.status}</strong>
          </p>
          <Button onClick={() => navigate(`/hackathon/${slug}`)}>Back to Hackathon</Button>
        </div>
      </div>
    );
  }

  const customFields = hackathon?.registrationSettings?.customFields || [];

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate(`/hackathon/${slug}`)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {hackathon?.title}
        </button>

        <h1 className="text-2xl font-black text-foreground mb-2">Register for {hackathon?.title}</h1>
        <p className="text-muted-foreground mb-8">Fill out the form below to apply.</p>

        {error && (
          <div className="mb-6 rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Default fields */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={currentUser?.email || ""} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivation">Why do you want to participate?</Label>
            <Textarea
              id="motivation"
              value={formResponses.motivation || ""}
              onChange={(e) => setFormResponses({ ...formResponses, motivation: e.target.value })}
              placeholder="Tell us about your motivation and what you hope to achieve..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Experience Level</Label>
            <select
              id="experience"
              value={formResponses.experienceLevel || ""}
              onChange={(e) => setFormResponses({ ...formResponses, experienceLevel: e.target.value })}
              className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
            >
              <option value="">Select...</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input
              id="skills"
              value={formResponses.skills || ""}
              onChange={(e) => setFormResponses({ ...formResponses, skills: e.target.value })}
              placeholder="e.g. Python, React, Machine Learning"
            />
          </div>

          {/* ── Skills Survey ── */}
          <div className="space-y-5 border-t-2 border-border pt-6">
            <h3 className="text-lg font-black text-foreground">Skills & Experience Survey</h3>

            {/* Experience level */}
            <div className="space-y-2">
              <Label>Experience building digital products</Label>
              <div className="flex flex-wrap gap-2">
                {["Beginner", "Intermediate", "Advanced"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormResponses({ ...formResponses, experienceLevel: level })}
                    className={`rounded-base border-2 px-4 py-2 text-sm font-bold transition-colors ${
                      formResponses.experienceLevel === level
                        ? "bg-main text-main-foreground border-border shadow-neo-sm"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Yes/No questions */}
            {[
              { key: "builtProduct", label: "Have you built a complete digital product before?" },
              { key: "previousHackathon", label: "Have you participated in a hackathon before?" },
            ].map((q) => (
              <div key={q.key} className="space-y-2">
                <Label>{q.label}</Label>
                <div className="flex gap-2">
                  {["Yes", "No"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFormResponses({ ...formResponses, [q.key]: v })}
                      className={`rounded-base border-2 px-6 py-2 text-sm font-bold transition-colors ${
                        formResponses[q.key] === v
                          ? "bg-main text-main-foreground border-border shadow-neo-sm"
                          : "bg-card text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Skills checkboxes - grouped */}
            {[
              { label: "Programming Languages", key: "programmingLangs", options: ["Python", "JavaScript", "TypeScript", "SQL", "Java", "C++", "Go", "Rust"] },
              { label: "AI Coding Tools", key: "aiTools", options: ["Cursor", "Bolt", "v0", "Replit", "Lovable", "Windsurf", "GitHub Copilot"] },
              { label: "AI Models", key: "aiModels", options: ["ChatGPT / OpenAI", "Claude / Anthropic", "Gemini / Google", "Llama / Meta", "Mistral"] },
              { label: "Web Development", key: "webDev", options: ["React", "Next.js", "Vue", "Supabase", "Firebase", "PostgreSQL", "MongoDB", "Node.js"] },
              { label: "Design", key: "designTools", options: ["Figma", "UI/UX Design", "Adobe XD", "Canva", "Framer"] },
              { label: "Soft Skills", key: "softSkills", options: ["Teamwork", "Leadership", "Problem Solving", "Time Management", "Communication", "Presentation"] },
            ].map((group) => (
              <div key={group.key} className="space-y-2">
                <Label>{group.label}</Label>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((opt) => {
                    const selected = (formResponses[group.key] || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          const current = formResponses[group.key] || [];
                          const updated = selected ? current.filter((s) => s !== opt) : [...current, opt];
                          setFormResponses({ ...formResponses, [group.key]: updated });
                        }}
                        className={`rounded-base border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
                          selected
                            ? "bg-main text-main-foreground border-border shadow-neo-sm"
                            : "bg-card text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Commitment + Consent */}
            <div className="space-y-3 border-t border-border pt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formResponses.attendanceCommitment || false}
                  onChange={(e) => setFormResponses({ ...formResponses, attendanceCommitment: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-2 border-border"
                />
                <span className="text-sm text-foreground">I commit to attending the full hackathon and all required sessions</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formResponses.consentDataSharing || false}
                  onChange={(e) => setFormResponses({ ...formResponses, consentDataSharing: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-2 border-border"
                />
                <span className="text-sm text-foreground">I agree to share my profile data with hackathon sponsors</span>
              </label>
            </div>

            {/* Project idea (optional) */}
            <div className="space-y-2">
              <Label>Project Idea (optional)</Label>
              <Textarea
                value={formResponses.projectIdea || ""}
                onChange={(e) => setFormResponses({ ...formResponses, projectIdea: e.target.value })}
                placeholder="Briefly describe your project idea if you have one..."
                rows={3}
              />
            </div>
          </div>

          {/* Custom fields from hackathon settings */}
          {customFields.map((field) => {
            const key = field.id || field.name;
            const label = field.label || field.name;
            return (
              <div key={key} className="space-y-2">
                {field.type !== "checkbox" && (
                  <Label htmlFor={`custom-${key}`}>
                    {label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                )}

                {field.type === "textarea" && (
                  <Textarea
                    id={`custom-${key}`}
                    value={formResponses[key] || ""}
                    onChange={(e) => setFormResponses({ ...formResponses, [key]: e.target.value })}
                    required={field.required}
                  />
                )}

                {field.type === "select" && (
                  <select
                    id={`custom-${key}`}
                    value={formResponses[key] || ""}
                    onChange={(e) => setFormResponses({ ...formResponses, [key]: e.target.value })}
                    required={field.required}
                    className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
                  >
                    <option value="">Select...</option>
                    {(field.options || []).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {field.type === "checkbox" && (
                  <div className="flex items-center gap-2">
                    <input
                      id={`custom-${key}`}
                      type="checkbox"
                      checked={!!formResponses[key]}
                      onChange={(e) => setFormResponses({ ...formResponses, [key]: e.target.checked })}
                      className="h-4 w-4 rounded border-2 border-border accent-main"
                    />
                    <span className="text-sm text-foreground">{label}</span>
                  </div>
                )}

                {field.type === "radio" && (
                  <div className="space-y-2">
                    {(field.options || []).map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-foreground">
                        <input
                          type="radio"
                          name={`custom-${key}`}
                          value={opt}
                          checked={formResponses[key] === opt}
                          onChange={(e) => setFormResponses({ ...formResponses, [key]: e.target.value })}
                          required={field.required}
                          className="h-4 w-4 accent-main"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {(!field.type || field.type === "text" || !["textarea", "select", "checkbox", "radio"].includes(field.type)) && (
                  <Input
                    id={`custom-${key}`}
                    type="text"
                    value={formResponses[key] || ""}
                    onChange={(e) => setFormResponses({ ...formResponses, [key]: e.target.value })}
                    required={field.required}
                  />
                )}
              </div>
            );
          })}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Submitting..." : "Submit Registration"}
          </Button>
        </form>
      </div>
    </div>
  );
}
