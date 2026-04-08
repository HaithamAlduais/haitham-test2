import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/LanguageContext";

const SELECT_CLASS =
  "flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-main";

export default function DateEditor({ config, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("dateFormat") || "Date Format"}</Label>
        <select
          className={SELECT_CLASS}
          value={config.format || "y-M-d"}
          onChange={(e) => onChange({ format: e.target.value })}
        >
          <option value="y-M-d">YYYY-MM-DD</option>
          <option value="d-M-y">DD-MM-YYYY</option>
          <option value="M-d-y">MM-DD-YYYY</option>
        </select>
      </div>
    </div>
  );
}
