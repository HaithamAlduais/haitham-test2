import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Trophy } from "lucide-react";

export default function PrizesStep({ data, onChange, onNext, onBack }) {
  const prizes = data.prizes || [];
  const [newPrize, setNewPrize] = useState({ place: "", title: "", description: "", value: "" });

  const addPrize = () => {
    if (!newPrize.title.trim()) return;
    onChange({ prizes: [...prizes, { ...newPrize, id: crypto.randomUUID() }] });
    setNewPrize({ place: "", title: "", description: "", value: "" });
  };

  const removePrize = (idx) => {
    onChange({ prizes: prizes.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">Prizes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define prizes and awards for winners. This is optional.
        </p>
      </div>

      {prizes.length > 0 && (
        <div className="space-y-3">
          {prizes.map((prize, idx) => (
            <div
              key={prize.id || idx}
              className="flex items-start gap-3 rounded-base border-2 border-border bg-card p-4"
            >
              <Trophy className="h-5 w-5 shrink-0 text-main mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">
                  {prize.place && `${prize.place} — `}{prize.title}
                </p>
                {prize.value && (
                  <p className="text-sm text-main font-bold">{prize.value}</p>
                )}
                {prize.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{prize.description}</p>
                )}
              </div>
              <button
                onClick={() => removePrize(idx)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-base border-2 border-dashed border-border p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Place (e.g. 1st, 2nd)</Label>
            <Input
              value={newPrize.place}
              onChange={(e) => setNewPrize({ ...newPrize, place: e.target.value })}
              placeholder="1st Place"
            />
          </div>
          <div className="space-y-1">
            <Label>Prize Title *</Label>
            <Input
              value={newPrize.title}
              onChange={(e) => setNewPrize({ ...newPrize, title: e.target.value })}
              placeholder="Grand Prize"
            />
          </div>
          <div className="space-y-1">
            <Label>Value</Label>
            <Input
              value={newPrize.value}
              onChange={(e) => setNewPrize({ ...newPrize, value: e.target.value })}
              placeholder="$5,000 or Gift Cards"
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input
              value={newPrize.description}
              onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })}
              placeholder="Brief description of the prize"
            />
          </div>
        </div>
        <Button variant="neutral" size="sm" onClick={addPrize} disabled={!newPrize.title.trim()}>
          <Plus className="h-4 w-4" /> Add Prize
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>← Back</Button>
        <Button onClick={onNext}>Next: Team Settings →</Button>
      </div>
    </div>
  );
}
