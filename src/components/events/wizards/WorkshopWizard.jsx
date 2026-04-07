import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiPost } from "@/utils/apiClient";

const STEPS = ["Info", "Schedule", "Settings", "Review"];

export default function WorkshopWizard({ onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [data, setData] = useState({
    name: "", tagline: "", description: "",
    speaker: "", platform: "zoom", meetingLink: "",
    capacity: 100,
    schedule: { registrationOpen: "", registrationClose: "", eventDate: "" },
    registrationSettings: { requireApproval: false, customFields: [] },
    isPublic: true,
  });

  const update = (partial) => setData((p) => ({ ...p, ...partial }));
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (publish) => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await apiPost("/api/events", { ...data, eventType: "workshop", isPublic: publish });
      setSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
        <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center px-6 md:px-12 shrink-0">
          <h1 className="font-heading font-black text-lg text-foreground">Workshop Created</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full border-2 border-border bg-main flex items-center justify-center shadow-neo-sm">
              <span className="text-2xl text-main-foreground font-black">✓</span>
            </div>
            <h2 className="text-2xl font-black text-foreground">{data.name}</h2>
            <p className="text-muted-foreground">Your workshop has been created.</p>
            <Button onClick={() => { onClose?.(); navigate("/hackathons"); }}>Go to My Events</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center justify-between px-6 md:px-12 shrink-0">
        <h1 className="font-heading font-black text-lg text-foreground">Create Workshop</h1>
        <button onClick={onClose} className="font-mono font-bold text-lg text-muted-foreground hover:text-destructive">✕</button>
      </header>

      <div className="border-b-2 border-border bg-secondary-background px-6 md:px-12 py-3 shrink-0">
        <div className="max-w-3xl mx-auto flex gap-1">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => i < step && setStep(i)} disabled={i > step}
              className={`px-3 py-1.5 rounded-base text-xs font-bold border-2 whitespace-nowrap ${i === step ? "bg-main text-main-foreground border-border shadow-neo-sm" : i < step ? "bg-card text-foreground border-border cursor-pointer" : "bg-background text-muted-foreground border-transparent cursor-not-allowed"}`}>
              {i + 1}. {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8">
        <div className="max-w-3xl mx-auto">
          {step === 0 && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-black">Workshop Details</h2><p className="text-sm text-muted-foreground mt-1">Basic information about your workshop.</p></div>
              <div className="space-y-2"><Label>Title *</Label><Input value={data.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Introduction to React Hooks" /></div>
              <div className="space-y-2"><Label>Tagline</Label><Input value={data.tagline} onChange={(e) => update({ tagline: e.target.value })} placeholder="Short description" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={data.description} onChange={(e) => update({ description: e.target.value })} rows={4} placeholder="What will participants learn?" /></div>
              <div className="space-y-2"><Label>Speaker / Instructor</Label><Input value={data.speaker} onChange={(e) => update({ speaker: e.target.value })} placeholder="Speaker name" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Platform</Label>
                  <select value={data.platform} onChange={(e) => update({ platform: e.target.value })} className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm">
                    <option value="zoom">Zoom</option><option value="discord">Discord</option><option value="teams">Teams</option><option value="in-person">In-Person</option>
                  </select>
                </div>
                <div className="space-y-2"><Label>Meeting Link</Label><Input value={data.meetingLink} onChange={(e) => update({ meetingLink: e.target.value })} placeholder="https://..." /></div>
              </div>
              <div className="flex justify-end"><Button onClick={next} disabled={!data.name.trim()}>Next →</Button></div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-black">Schedule</h2></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Registration Opens</Label><Input type="datetime-local" value={data.schedule.registrationOpen} onChange={(e) => update({ schedule: { ...data.schedule, registrationOpen: e.target.value } })} /></div>
                <div className="space-y-2"><Label>Registration Closes</Label><Input type="datetime-local" value={data.schedule.registrationClose} onChange={(e) => update({ schedule: { ...data.schedule, registrationClose: e.target.value } })} /></div>
                <div className="space-y-2 sm:col-span-2"><Label>Event Date & Time</Label><Input type="datetime-local" value={data.schedule.eventDate} onChange={(e) => update({ schedule: { ...data.schedule, eventDate: e.target.value } })} /></div>
              </div>
              <div className="flex justify-between"><Button variant="neutral" onClick={back}>← Back</Button><Button onClick={next}>Next →</Button></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-black">Settings</h2></div>
              <div className="space-y-2"><Label>Max Capacity</Label><Input type="number" min={1} value={data.capacity} onChange={(e) => update({ capacity: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-3"><Switch checked={data.registrationSettings.requireApproval} onCheckedChange={(v) => update({ registrationSettings: { ...data.registrationSettings, requireApproval: v } })} /><Label>Require registration approval</Label></div>
              <div className="flex justify-between"><Button variant="neutral" onClick={back}>← Back</Button><Button onClick={next}>Next →</Button></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-black">Review & Publish</h2></div>
              <div className="rounded-base border-2 border-border bg-card p-4 space-y-2">
                <p className="text-lg font-black">{data.name || "Untitled"}</p>
                {data.speaker && <p className="text-sm text-muted-foreground">Speaker: {data.speaker}</p>}
                <p className="text-sm">Platform: {data.platform} | Capacity: {data.capacity}</p>
              </div>
              {error && <div className="rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <div className="flex justify-between">
                <Button variant="neutral" onClick={back}>← Back</Button>
                <div className="flex gap-3">
                  <Button variant="neutral" onClick={() => handleSubmit(false)} disabled={submitting}>{submitting ? "Saving..." : "Save Draft"}</Button>
                  <Button onClick={() => handleSubmit(true)} disabled={submitting}>{submitting ? "Publishing..." : "Publish"}</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
