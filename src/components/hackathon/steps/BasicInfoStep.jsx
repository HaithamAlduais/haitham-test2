import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Monitor, MapPin, Laptop } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function BasicInfoStep({ data, onChange, onNext }) {
  const { t } = useLanguage();
  const canProceed = data.title.trim().length > 0;

  const FORMAT_OPTIONS = [
    { value: "online", label: t("formatOnline"), icon: Monitor },
    { value: "in-person", label: t("formatInPerson"), icon: MapPin },
    { value: "hybrid", label: t("formatHybrid"), icon: Laptop },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">{t("basicInfoTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("basicInfoDesc")}
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">{t("hackathonTitleLabel")}</Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder={t("hackathonTitlePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">{t("taglineLabel")}</Label>
          <Input
            id="tagline"
            value={data.tagline}
            onChange={(e) => onChange({ tagline: e.target.value })}
            placeholder={t("taglinePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("formatLabel")}</Label>
          <div className="flex gap-2">
            {FORMAT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ format: value })}
                className={`flex items-center gap-2 rounded-base border-2 px-4 py-2 text-sm font-bold transition-colors ${
                  (data.format || "online") === value
                    ? "border-border bg-main text-main-foreground shadow-neo-sm"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">{t("descriptionLabel2")}</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder={t("descriptionPlaceholder2")}
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rules">{t("rulesTitle")}</Label>
          <Textarea
            id="rules"
            value={data.rules}
            onChange={(e) => onChange({ rules: e.target.value })}
            placeholder={t("rulesPlaceholder")}
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed}>
          {t("nextSchedule")}
        </Button>
      </div>
    </div>
  );
}
