import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { suggestForStep } from "@/services/wizardAIService";

const DEFAULT_CRITERIA = [
  { name: "Innovation", weight: 25, maxScore: 5 },
  { name: "Technical Implementation", weight: 25, maxScore: 5 },
  { name: "Design & UX", weight: 20, maxScore: 5 },
  { name: "Impact & Feasibility", weight: 20, maxScore: 5 },
  { name: "Presentation", weight: 10, maxScore: 5 },
];

export default function JudgingCriteriaStep({ data, onChange, onNext, onBack }) {
  const { t } = useLanguage();
  const criteria = data.judgingCriteria || [];
  const [newCriterion, setNewCriterion] = useState({ name: "", weight: 20, maxScore: 5 });
  const [suggesting, setSuggesting] = useState(false);

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

  const handleAISuggest = async () => {
    setSuggesting(true);
    try {
      const result = await suggestForStep("judging", data);
      if (result && Array.isArray(result)) {
        const withIds = result.map((c) => ({ ...c, id: crypto.randomUUID() }));
        onChange({ judgingCriteria: withIds });
      }
    } finally {
      setSuggesting(false);
    }
  };

  const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground">{t("judgingTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("judgingDesc")}
          </p>
        </div>
        <Button variant="neutral" size="sm" onClick={handleAISuggest} disabled={suggesting}>
          <Sparkles className="h-4 w-4" />
          {suggesting ? "..." : t("aiSuggest")}
        </Button>
      </div>

      {criteria.length === 0 && (
        <Button variant="neutral" onClick={loadDefaults}>
          {t("loadDefaults")}
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
                {t("weightColLabel")}: {c.weight}% &middot; {t("maxScoreLabel")}: {c.maxScore}
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
            {t("totalWeight")}: {totalWeight}%{totalWeight !== 100 && ` ${t("shouldBe100")}`}
          </p>
        </div>
      )}

      {/* Add new criterion */}
      <div className="rounded-base border-2 border-dashed border-border p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1 sm:col-span-1">
            <Label>{t("judgingCriterionName")}</Label>
            <Input
              value={newCriterion.name}
              onChange={(e) => setNewCriterion({ ...newCriterion, name: e.target.value })}
              placeholder={t("judgingCriterionPlaceholder")}
            />
          </div>
          <div className="space-y-1">
            <Label>{t("weightPercent")}</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={newCriterion.weight}
              onChange={(e) => setNewCriterion({ ...newCriterion, weight: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label>{t("maxScoreLabel")}</Label>
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
          <Plus className="h-4 w-4" /> {t("addCriterion")}
        </Button>
      </div>

      {/* Popular Choice Voting Toggle */}
      <div className="rounded-base border-2 border-border bg-card p-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-foreground text-sm">{t("popularChoice")}</p>
          <p className="text-xs text-muted-foreground">{t("popularChoiceDesc")}</p>
        </div>
        <button
          onClick={() => onChange({ enablePopularVote: !data.enablePopularVote })}
          className={`w-12 h-7 rounded-full border-2 border-border transition-colors flex items-center ${data.enablePopularVote ? 'bg-main justify-end' : 'bg-muted justify-start'}`}
        >
          <div className="w-5 h-5 rounded-full bg-white border border-border mx-0.5" />
        </button>
      </div>

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>{t("backBtn")}</Button>
        <Button onClick={onNext}>{t("nextPrizes")}</Button>
      </div>
    </div>
  );
}
