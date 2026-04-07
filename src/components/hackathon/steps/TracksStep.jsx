import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default function TracksStep({ data, onChange, onNext, onBack }) {
  const tracks = data.tracks || [];
  const [newTrack, setNewTrack] = useState({ name: "", description: "" });

  const addTrack = () => {
    if (!newTrack.name.trim()) return;
    onChange({ tracks: [...tracks, { ...newTrack, id: crypto.randomUUID() }] });
    setNewTrack({ name: "", description: "" });
  };

  const removeTrack = (idx) => {
    onChange({ tracks: tracks.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">Tracks / Categories</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define challenge tracks for your hackathon. This is optional — skip if you don't need tracks.
        </p>
      </div>

      {/* Existing tracks */}
      {tracks.length > 0 && (
        <div className="space-y-3">
          {tracks.map((track, idx) => (
            <div
              key={track.id || idx}
              className="flex items-start gap-3 rounded-base border-2 border-border bg-card p-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">{track.name}</p>
                {track.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{track.description}</p>
                )}
              </div>
              <button
                onClick={() => removeTrack(idx)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new track */}
      <div className="rounded-base border-2 border-dashed border-border p-4 space-y-3">
        <div className="space-y-2">
          <Label>Track Name</Label>
          <Input
            value={newTrack.name}
            onChange={(e) => setNewTrack({ ...newTrack, name: e.target.value })}
            placeholder="e.g. AI & Machine Learning"
          />
        </div>
        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Textarea
            value={newTrack.description}
            onChange={(e) => setNewTrack({ ...newTrack, description: e.target.value })}
            placeholder="What should participants build in this track?"
            rows={2}
          />
        </div>
        <Button variant="neutral" size="sm" onClick={addTrack} disabled={!newTrack.name.trim()}>
          <Plus className="h-4 w-4" /> Add Track
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>← Back</Button>
        <Button onClick={onNext}>Next: Judging →</Button>
      </div>
    </div>
  );
}
