import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { suggestForStep } from "@/services/wizardAIService";

export default function ScheduleStep({ data, onChange, onNext, onBack }) {
  const { t } = useLanguage();
  const [suggesting, setSuggesting] = useState(false);
  const schedule = data.schedule || {};

  const FIELDS = [
    { key: "registrationOpen", label: t("regOpen") },
    { key: "registrationClose", label: t("regClose") },
    { key: "submissionDeadline", label: t("submissionDeadline") },
    { key: "judgingStart", label: t("judgingStart") },
    { key: "judgingEnd", label: t("judgingEnd") },
  ];

  const updateSchedule = (key, value) => {
    onChange({ schedule: { ...schedule, [key]: value } });
  };

  const handleAISuggest = async () => {
    setSuggesting(true);
    try {
      const result = await suggestForStep("schedule", data);
      if (result) {
        onChange({ schedule: { ...schedule, ...result } });
      }
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground">{t("scheduleTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("scheduleDesc")}
          </p>
        </div>
        <Button variant="neutral" size="sm" onClick={handleAISuggest} disabled={suggesting}>
          <Sparkles className="h-4 w-4" />
          {suggesting ? "..." : t("aiSuggest")}
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {FIELDS.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type="datetime-local"
              value={schedule[key] || ""}
              onChange={(e) => updateSchedule(key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>
          {t("backBtn")}
        </Button>
        <Button onClick={onNext}>
          {t("nextAIScreening")}
        </Button>
      </div>
    </div>
  );
}
