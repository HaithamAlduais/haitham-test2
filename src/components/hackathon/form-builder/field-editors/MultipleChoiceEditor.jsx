import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function MultipleChoiceEditor({ config, onChange }) {
  const { t } = useLanguage();
  const choices = config.choices || [];

  const updateChoice = (id, updates) => {
    onChange({
      choices: choices.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  const addChoice = () => {
    const num = choices.length + 1;
    onChange({
      choices: [
        ...choices,
        {
          id: crypto.randomUUID(),
          label: `Option ${num}`,
          labelAr: `\u062e\u064a\u0627\u0631 ${num}`,
        },
      ],
    });
  };

  const removeChoice = (id) => {
    if (choices.length <= 1) return;
    onChange({ choices: choices.filter((c) => c.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("choices") || "Choices"}</Label>
        <div className="space-y-2">
          {choices.map((choice) => (
            <div key={choice.id} className="flex items-center gap-2">
              <Input
                value={choice.label}
                onChange={(e) =>
                  updateChoice(choice.id, { label: e.target.value })
                }
                placeholder={t("choiceLabelEn") || "English label"}
                className="flex-1"
              />
              <Input
                value={choice.labelAr || ""}
                onChange={(e) =>
                  updateChoice(choice.id, { labelAr: e.target.value })
                }
                placeholder={t("choiceLabelAr") || "Arabic label"}
                className="flex-1"
                dir="rtl"
              />
              <button
                type="button"
                onClick={() => removeChoice(choice.id)}
                disabled={choices.length <= 1}
                className="rounded-base p-1.5 text-muted-foreground hover:bg-red-500 hover:text-white transition-colors disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="noShadow"
          size="sm"
          onClick={addChoice}
          className="gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("addChoice") || "Add Choice"}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="allowOther">
          {t("allowOther") || "Allow 'Other' option"}
        </Label>
        <Switch
          id="allowOther"
          checked={config.allowOther || false}
          onCheckedChange={(checked) => onChange({ allowOther: checked })}
        />
      </div>
    </div>
  );
}
