import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Brain } from "lucide-react";

const DEFAULT_CONFIG = {
  enabled: false,
  criteria: [],
  autoAcceptThreshold: 80,
  autoRejectThreshold: 30,
  language: "both",
};

export default function AIScreeningStep({ data, onChange, onNext, onBack }) {
  const config = { ...DEFAULT_CONFIG, ...data.aiScreeningConfig };
  const [newCriterion, setNewCriterion] = useState({ name: "", weight: 50, description: "" });

  const updateConfig = (partial) => {
    onChange({ aiScreeningConfig: { ...config, ...partial } });
  };

  const addCriterion = () => {
    if (!newCriterion.name.trim()) return;
    updateConfig({
      criteria: [...config.criteria, { ...newCriterion, id: crypto.randomUUID() }],
    });
    setNewCriterion({ name: "", weight: 50, description: "" });
  };

  const removeCriterion = (idx) => {
    updateConfig({ criteria: config.criteria.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">AI Screening</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure AI-powered screening to automatically evaluate and filter applications.
        </p>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center gap-3 rounded-base border-2 border-border bg-card p-4">
        <Switch
          id="ai-enabled"
          checked={config.enabled}
          onCheckedChange={(checked) => updateConfig({ enabled: checked })}
        />
        <Label htmlFor="ai-enabled" className="cursor-pointer font-bold">
          Enable AI Screening
        </Label>
      </div>

      {config.enabled && (
        <div className="space-y-6">
          {/* Thresholds */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="autoAccept">Auto-Accept Threshold (0-100)</Label>
              <Input
                id="autoAccept"
                type="number"
                min={0}
                max={100}
                value={config.autoAcceptThreshold}
                onChange={(e) =>
                  updateConfig({ autoAcceptThreshold: Number(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                Applications scoring above this are automatically accepted.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoReject">Auto-Reject Threshold (0-100)</Label>
              <Input
                id="autoReject"
                type="number"
                min={0}
                max={100}
                value={config.autoRejectThreshold}
                onChange={(e) =>
                  updateConfig({ autoRejectThreshold: Number(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                Applications scoring below this are automatically rejected.
              </p>
            </div>
          </div>

          {/* Language preference */}
          <div className="space-y-2">
            <Label htmlFor="language">Language Preference</Label>
            <select
              id="language"
              value={config.language}
              onChange={(e) => updateConfig({ language: e.target.value })}
              className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="both">Both (English & Arabic)</option>
            </select>
          </div>

          {/* Criteria list */}
          {config.criteria.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-bold">Screening Criteria</Label>
              {config.criteria.map((criterion, idx) => (
                <div
                  key={criterion.id || idx}
                  className="flex items-start gap-3 rounded-base border-2 border-border bg-card p-4"
                >
                  <Brain className="h-5 w-5 shrink-0 text-main mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{criterion.name}</p>
                    <p className="text-sm text-main font-bold">
                      Weight: {criterion.weight}
                    </p>
                    {criterion.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {criterion.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeCriterion(idx)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add criterion form */}
          <div className="rounded-base border-2 border-dashed border-border p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Criterion Name *</Label>
                <Input
                  value={newCriterion.name}
                  onChange={(e) =>
                    setNewCriterion({ ...newCriterion, name: e.target.value })
                  }
                  placeholder="e.g. Technical Feasibility"
                />
              </div>
              <div className="space-y-1">
                <Label>Weight (1-100)</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={newCriterion.weight}
                  onChange={(e) =>
                    setNewCriterion({ ...newCriterion, weight: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={newCriterion.description}
                onChange={(e) =>
                  setNewCriterion({ ...newCriterion, description: e.target.value })
                }
                placeholder="What should the AI evaluate for this criterion?"
                rows={2}
              />
            </div>
            <Button
              variant="neutral"
              size="sm"
              onClick={addCriterion}
              disabled={!newCriterion.name.trim()}
            >
              <Plus className="h-4 w-4" /> Add Criterion
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext}>Next: Workback Schedule →</Button>
      </div>
    </div>
  );
}
