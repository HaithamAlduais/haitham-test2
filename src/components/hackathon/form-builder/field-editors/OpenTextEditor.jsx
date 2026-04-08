import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/LanguageContext";

const SELECT_CLASS =
  "flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-main";

export default function OpenTextEditor({ config, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("inputType") || "Input Type"}</Label>
        <select
          className={SELECT_CLASS}
          value={config.inputType || "text"}
          onChange={(e) => onChange({ inputType: e.target.value })}
        >
          <option value="text">{t("text") || "Text"}</option>
          <option value="email">{t("email") || "Email"}</option>
          <option value="url">{t("url") || "URL"}</option>
          <option value="number">{t("number") || "Number"}</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>{t("placeholder") || "Placeholder"}</Label>
        <Input
          value={config.placeholder || ""}
          onChange={(e) => onChange({ placeholder: e.target.value })}
          placeholder={t("placeholderHint") || "Enter placeholder text..."}
        />
      </div>
    </div>
  );
}
