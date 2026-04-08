import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/LanguageContext";

const SELECT_CLASS =
  "flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-main";

export default function RatingEditor({ config, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("scaleType") || "Scale Type"}</Label>
        <select
          className={SELECT_CLASS}
          value={config.scale || "star"}
          onChange={(e) => onChange({ scale: e.target.value })}
        >
          <option value="star">{t("stars") || "Stars"}</option>
          <option value="number">{t("numbers") || "Numbers"}</option>
          <option value="smiley">{t("smileys") || "Smileys"}</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>{t("range") || "Range"}</Label>
        <select
          className={SELECT_CLASS}
          value={config.range || 5}
          onChange={(e) => onChange({ range: Number(e.target.value) })}
        >
          {[3, 4, 5, 7, 10].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>{t("lowerLabel") || "Lower Label"}</Label>
        <Input
          value={config.lowerLabel || ""}
          onChange={(e) => onChange({ lowerLabel: e.target.value })}
          placeholder={t("lowerLabelHint") || "e.g. Poor"}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("upperLabel") || "Upper Label"}</Label>
        <Input
          value={config.upperLabel || ""}
          onChange={(e) => onChange({ upperLabel: e.target.value })}
          placeholder={t("upperLabelHint") || "e.g. Excellent"}
        />
      </div>
    </div>
  );
}
