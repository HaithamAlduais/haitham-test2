import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { apiPost } from "@/utils/apiClient";

const STEPS = ["Info", "Tracks", "Schedule", "Review"];

export default function ConferenceWizard({ onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newTrack, setNewTrack] = useState({ name: "", description: "" });

  const [data, setData] = useState({
    name: "", tagline: "", description: "",
    tracks: [], capacity: 500,
    schedule: { registrationOpen: "", registrationClose: "", startDate: "", endDate: "" },
    registrationSettings: { requireApproval: false, customFields: [] },
    isPublic: true,
  });

  const update = (partial) => setData((p) => ({ ...p, ...partial }));
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const addTrack = () => {
    if (!newTrack.name.trim()) return;
    update({ tracks: [...data.tracks, { ...newTrack, id: crypto.randomUUID() }] });
    setNewTrack({ name: "", description: "" });
  };

  const handleSubmit = async (publish) => {
    setError(null); setSubmitting(true);
    try {
      await apiPost("/api/events", { ...data, eventType: "conference", isPublic: publish });
      setSuccess(true);
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
        <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center px-6 md:px-12 shrink-0"><h1 className="font-heading font-black text-lg">Conference Created</h1></header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full border-2 border-border bg-main flex items-center justify-center shadow-neo-sm"><span className="text-2xl text-main-foreground font-black">✓</span></div>
            <h2 className="text-2xl font-black">{data.name}</h2>
            <Button onClick={() => { onClose?.(); navigate("/hackathons"); }}>Go to My Events</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center justify-between px-6 md:px-12 shrink-0">
        <h1 className="font-heading font-black text-lg">Create Conference</h1>
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
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8"><div className="max-w-3xl mx-auto">
        {step === 0 && (<div className="space-y-6">
          <div><h2 className="text-2xl font-black">Conference Details</h2></div>
          <div className="space-y-2"><Label>Title *</Label><Input value={data.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Tech Summit 2026" /></div>
          <div className="space-y-2"><Label>Tagline</Label><Input value={data.tagline} onChange={(e) => update({ tagline: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={data.description} onChange={(e) => update({ description: e.target.value })} rows={4} /></div>
          <div className="space-y-2"><Label>Max Capacity</Label><Input type="number" min={1} value={data.capacity} onChange={(e) => update({ capacity: Number(e.target.value) })} /></div>
          <div className="flex justify-end"><Button onClick={next} disabled={!data.name.trim()}>Next →</Button></div>
        </div>)}

        {step === 1 && (<div className="space-y-6">
          <div><h2 className="text-2xl font-black">Tracks / Sessions</h2><p className="text-sm text-muted-foreground mt-1">Define conference tracks or session categories.</p></div>
          {data.tracks.length > 0 && (<div className="space-y-2">
            {data.tracks.map((t, i) => (
              <div key={t.id || i} className="flex items-start gap-3 rounded-base border-2 border-border bg-card p-3">
                <div className="flex-1"><p className="font-bold">{t.name}</p>{t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}</div>
                <button onClick={() => update({ tracks: data.tracks.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>)}
          <div className="rounded-base border-2 border-dashed border-border p-4 space-y-3">
            <div className="space-y-2"><Label>Track Name</Label><Input value={newTrack.name} onChange={(e) => setNewTrack({ ...newTrack, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={newTrack.description} onChange={(e) => setNewTrack({ ...newTrack, description: e.target.value })} /></div>
            <Button variant="neutral" size="sm" onClick={addTrack} disabled={!newTrack.name.trim()}><Plus className="h-4 w-4" /> Add Track</Button>
          </div>
          <div className="flex justify-between"><Button variant="neutral" onClick={back}>← Back</Button><Button onClick={next}>Next →</Button></div>
        </div>)}

        {step === 2 && (<div className="space-y-6">
          <div><h2 className="text-2xl font-black">Schedule</h2></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Registration Opens</Label><Input type="datetime-local" value={data.schedule.registrationOpen} onChange={(e) => update({ schedule: { ...data.schedule, registrationOpen: e.target.value } })} /></div>
            <div className="space-y-2"><Label>Registration Closes</Label><Input type="datetime-local" value={data.schedule.registrationClose} onChange={(e) => update({ schedule: { ...data.schedule, registrationClose: e.target.value } })} /></div>
            <div className="space-y-2"><Label>Start Date</Label><Input type="datetime-local" value={data.schedule.startDate} onChange={(e) => update({ schedule: { ...data.schedule, startDate: e.target.value } })} /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="datetime-local" value={data.schedule.endDate} onChange={(e) => update({ schedule: { ...data.schedule, endDate: e.target.value } })} /></div>
          </div>
          <div className="flex justify-between"><Button variant="neutral" onClick={back}>← Back</Button><Button onClick={next}>Next →</Button></div>
        </div>)}

        {step === 3 && (<div className="space-y-6">
          <div><h2 className="text-2xl font-black">Review & Publish</h2></div>
          <div className="rounded-base border-2 border-border bg-card p-4 space-y-2">
            <p className="text-lg font-black">{data.name}</p>
            <p className="text-sm">{data.tracks.length} tracks | Capacity: {data.capacity}</p>
          </div>
          {error && <div className="rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <div className="flex justify-between">
            <Button variant="neutral" onClick={back}>← Back</Button>
            <div className="flex gap-3">
              <Button variant="neutral" onClick={() => handleSubmit(false)} disabled={submitting}>{submitting ? "Saving..." : "Save Draft"}</Button>
              <Button onClick={() => handleSubmit(true)} disabled={submitting}>{submitting ? "Publishing..." : "Publish"}</Button>
            </div>
          </div>
        </div>)}
      </div></div>
    </div>
  );
}
