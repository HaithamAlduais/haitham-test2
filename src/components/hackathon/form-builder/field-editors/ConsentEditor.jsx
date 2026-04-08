import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/LanguageContext";

export default function ConsentEditor({ config, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("consentTextEn") || "Consent Text (English)"}</Label>
        <Textarea
          value={config.consentText || ""}
          onChange={(e) => onChange({ consentText: e.target.value })}
          placeholder={
            t("consentTextHint") ||
            "I agree to the terms and conditions..."
          }
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("consentTextAr") || "Consent Text (Arabic)"}</Label>
        <Textarea
          value={config.consentTextAr || ""}
          onChange={(e) => onChange({ consentTextAr: e.target.value })}
          placeholder={
            t("consentTextArHint") ||
            "\u0623\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0627\u0644\u0634\u0631\u0648\u0637 \u0648\u0627\u0644\u0623\u062d\u0643\u0627\u0645..."
          }
          rows={4}
          dir="rtl"
        />
      </div>
    </div>
  );
}
