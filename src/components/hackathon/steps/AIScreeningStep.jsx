import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Brain } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const DEFAULT_CONFIG = {
  enabled: false,
  criteria: [],
  autoAcceptThreshold: 80,
  autoRejectThreshold: 30,
  language: "both",
};

export default function AIScreeningStep({ data, onChange, onNext, onBack }) {
  const { t } = useLanguage();
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
        <h2 className="text-2xl font-black text-foreground">{t("aiScreeningTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("aiScreeningDesc")}
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
          {t("enableAIScreening")}
        </Label>
      </div>

      {config.enabled && (
        <div className="space-y-6">
          {/* Thresholds */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="autoAccept">{t("autoAcceptLabel")}</Label>
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
                {t("autoAcceptDesc")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoReject">{t("autoRejectLabel")}</Label>
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
                {t("autoRejectDesc")}
              </p>
            </div>
          </div>

          {/* Language preference */}
          <div className="space-y-2">
            <Label htmlFor="language">{t("languagePreference")}</Label>
            <select
              id="language"
              value={config.language}
              onChange={(e) => updateConfig({ language: e.target.value })}
              className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="en">{t("langEnglish")}</option>
              <option value="ar">{t("langArabic")}</option>
              <option value="both">{t("langBoth")}</option>
            </select>
          </div>

          {/* Criteria list */}
          {config.criteria.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-bold">{t("screeningCriteria")}</Label>
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
                <Label>{t("criterionNameLabel")}</Label>
                <Input
                  value={newCriterion.name}
                  onChange={(e) =>
                    setNewCriterion({ ...newCriterion, name: e.target.value })
                  }
                  placeholder={t("criterionNamePlaceholder")}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("weightLabel")}</Label>
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
              <Label>{t("criterionDescLabel")}</Label>
              <Textarea
                value={newCriterion.description}
                onChange={(e) =>
                  setNewCriterion({ ...newCriterion, description: e.target.value })
                }
                placeholder={t("criterionDescPlaceholder")}
                rows={2}
              />
            </div>
            <Button
              variant="neutral"
              size="sm"
              onClick={addCriterion}
              disabled={!newCriterion.name.trim()}
            >
              <Plus className="h-4 w-4" /> {t("addCriterion")}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>
          {t("backBtn")}
        </Button>
        <Button onClick={onNext}>{t("nextWorkbackSchedule")}</Button>
      </div>
    </div>
  );
}
