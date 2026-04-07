import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

const DEFAULT_CRITERIA = [
  { name: "Innovation", weight: 25, maxScore: 5 },
  { name: "Technical Implementation", weight: 25, maxScore: 5 },
  { name: "Design & UX", weight: 20, maxScore: 5 },
  { name: "Impact & Feasibility", weight: 20, maxScore: 5 },
  { name: "Presentation", weight: 10, maxScore: 5 },
];

export default function JudgingCriteriaStep({ data, onChange, onNext, onBack }) {
  const criteria = data.judgingCriteria || [];
  const [newCriterion, setNewCriterion] = useState({ name: "", weight: 20, maxScore: 5 });

  const addCriterion = () => {
    if (!newCriterion.name.trim()) return;
    onChange({ judgingCriteria: [...criteria, { ...newCriterion, id: crypto.randomUUID() }] });
    setNewCriterion({ name: "", weight: 20, maxScore: 5 });
  };

  const removeCriterion = (idx) => {
    onChange({ judgingCriteria: criteria.filter((_, i) => i !== idx) });
  };

  const loadDefaults = () => {
    onChange({
      judgingCriteria: DEFAULT_CRITERIA.map((c) => ({ ...c, id: crypto.randomUUID() })),
    });
  };

  const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">Judging Criteria</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define how submissions will be scored. Weights should add up to 100.
        </p>
      </div>

      {criteria.length === 0 && (
        <Button variant="neutral" onClick={loadDefaults}>
          Load Default Criteria
        </Button>
      )}

      {criteria.length > 0 && (
        <div className="space-y-3">
          {criteria.map((c, idx) => (
            <div
              key={c.id || idx}
              className="flex items-center gap-3 rounded-base border-2 border-border bg-card p-3"
            >
              <span className="flex-1 font-bold text-foreground text-sm">{c.name}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Weight: {c.weight}% &middot; Max: {c.maxScore}
              </span>
              <button
                onClick={() => removeCriterion(idx)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <p className={`text-sm font-bold ${totalWeight === 100 ? "text-main" : "text-destructive"}`}>
            Total weight: {totalWeight}%{totalWeight !== 100 && " (should be 100%)"}
          </p>
        </div>
      )}

      {/* Add new criterion */}
      <div className="rounded-base border-2 border-dashed border-border p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1 sm:col-span-1">
            <Label>Criterion Name</Label>
            <Input
              value={newCriterion.name}
              onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
              placeholder="e.g. Innovation"
            />
          </div>
          <div className="space-y-1">
            <Label>Weight (%)</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={newCriterion.weight}
              onChange={(e) => setNewCriterion({ ...newCriterion, weight: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label>Max Score</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={newCriterion.maxScore}
              onChange={(e) => setNewCriterion({ ...newCriterion, maxScore: Number(e.target.value) })}
            />
          </div>
        </div>
        <Button variant="neutral" size="sm" onClick={addCriterion} disabled={!newCriterion.name.trim()}>
          <Plus className="h-4 w-4" /> Add Criterion
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>← Back</Button>
        <Button onClick={onNext}>Next: Prizes →</Button>
      </div>
    </div>
  );
}
