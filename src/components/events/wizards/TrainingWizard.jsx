import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { apiPost } from "@/utils/apiClient";

const STEPS = ["Info", "Curriculum", "Schedule", "Review"];

export default function TrainingWizard({ onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newModule, setNewModule] = useState("");

  const [data, setData] = useState({
    name: "", tagline: "", description: "",
    instructor: "", level: "beginner", duration: "",
    modules: [], capacity: 50,
    schedule: { registrationOpen: "", registrationClose: "", startDate: "", endDate: "" },
    registrationSettings: { requireApproval: true, customFields: [] },
    isPublic: true,
  });

  const update = (partial) => setData((p) => ({ ...p, ...partial }));
  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const addModule = () => {
    if (!newModule.trim()) return;
    update({ modules: [...data.modules, newModule.trim()] });
    setNewModule("");
  };

  const handleSubmit = async (publish) => {
    setError(null); setSubmitting(true);
    try {
      await apiPost("/api/events", { ...data, eventType: "training", isPublic: publish });
      setSuccess(true);
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
        <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center px-6 md:px-12 shrink-0"><h1 className="font-heading font-black text-lg">Training Created</h1></header>
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
        <h1 className="font-heading font-black text-lg">Create Training Program</h1>
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
          <div><h2 className="text-2xl font-black">Training Details</h2></div>
          <div className="space-y-2"><Label>Title *</Label><Input value={data.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Advanced Python Bootcamp" /></div>
          <div className="space-y-2"><Label>Tagline</Label><Input value={data.tagline} onChange={(e) => update({ tagline: e.target.value })} /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={data.description} onChange={(e) => update({ description: e.target.value })} rows={4} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2"><Label>Instructor</Label><Input value={data.instructor} onChange={(e) => update({ instructor: e.target.value })} /></div>
            <div className="space-y-2"><Label>Level</Label>
              <select value={data.level} onChange={(e) => update({ level: e.target.value })} className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm">
                <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
              </select></div>
            <div className="space-y-2"><Label>Duration</Label><Input value={data.duration} onChange={(e) => update({ duration: e.target.value })} placeholder="e.g. 4 weeks" /></div>
          </div>
          <div className="flex justify-end"><Button onClick={next} disabled={!data.name.trim()}>Next →</Button></div>
        </div>)}

        {step === 1 && (<div className="space-y-6">
          <div><h2 className="text-2xl font-black">Curriculum</h2><p className="text-sm text-muted-foreground mt-1">Add modules or topics covered in this training.</p></div>
          {data.modules.length > 0 && (
            <div className="space-y-2">
              {data.modules.map((m, i) => (
                <div key={i} className="flex items-center gap-3 rounded-base border-2 border-border bg-card p-3">
                  <span className="text-xs font-bold text-muted-foreground w-6">{i + 1}.</span>
                  <span className="flex-1 text-foreground">{m}</span>
                  <button onClick={() => update({ modules: data.modules.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input value={newModule} onChange={(e) => setNewModule(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addModule())} placeholder="Module name" />
            <Button variant="neutral" onClick={addModule} disabled={!newModule.trim()}><Plus className="h-4 w-4" /> Add</Button>
          </div>
          <div className="flex justify-between"><Button variant="neutral" onClick={back}>← Back</Button><Button onClick={next}>Next →</Button></div>
        </div>)}

        {step === 2 && (<div className="space-y-6">
          <div><h2 className="text-2xl font-black">Schedule</h2></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Start Date</Label><Input type="datetime-local" value={data.schedule.startDate} onChange={(e) => update({ schedule: { ...data.schedule, startDate: e.target.value } })} /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="datetime-local" value={data.schedule.endDate} onChange={(e) => update({ schedule: { ...data.schedule, endDate: e.target.value } })} /></div>
          </div>
          <div className="space-y-2"><Label>Max Capacity</Label><Input type="number" min={1} value={data.capacity} onChange={(e) => update({ capacity: Number(e.target.value) })} /></div>
          <div className="flex justify-between"><Button variant="neutral" onClick={back}>← Back</Button><Button onClick={next}>Next →</Button></div>
        </div>)}

        {step === 3 && (<div className="space-y-6">
          <div><h2 className="text-2xl font-black">Review & Publish</h2></div>
          <div className="rounded-base border-2 border-border bg-card p-4 space-y-2">
            <p className="text-lg font-black">{data.name}</p>
            <p className="text-sm">Instructor: {data.instructor || "TBD"} | Level: {data.level} | {data.duration || "TBD"}</p>
            <p className="text-sm text-muted-foreground">{data.modules.length} modules | Capacity: {data.capacity}</p>
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
