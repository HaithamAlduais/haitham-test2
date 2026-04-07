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

          {/* Custom fields from hackathon settings */}
          {customFields.map((field, idx) => (
            <div key={idx} className="space-y-2">
              <Label htmlFor={`custom-${idx}`}>
                {field.name} {field.required && "*"}
              </Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={`custom-${idx}`}
                  value={formResponses[field.name] || ""}
                  onChange={(e) => setFormResponses({ ...formResponses, [field.name]: e.target.value })}
                  required={field.required}
                />
              ) : (
                <Input
                  id={`custom-${idx}`}
                  type={field.type || "text"}
                  value={formResponses[field.name] || ""}
                  onChange={(e) => setFormResponses({ ...formResponses, [field.name]: e.target.value })}
                  required={field.required}
                />
              )}
            </div>
          ))}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Submitting..." : "Submit Registration"}
          </Button>
        </form>
      </div>
    </div>
  );
}
