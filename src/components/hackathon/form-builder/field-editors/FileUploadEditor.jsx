import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/context/LanguageContext";

export default function FileUploadEditor({ config, onChange }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="allowMultiple">
          {t("allowMultipleFiles") || "Allow Multiple Files"}
        </Label>
        <Switch
          id="allowMultiple"
          checked={config.allowMultiple || false}
          onCheckedChange={(checked) => onChange({ allowMultiple: checked })}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("maxFileSize") || "Max File Size (MB)"}</Label>
        <Input
          type="number"
          min={1}
          max={100}
          value={config.maxSizeMB || 10}
          onChange={(e) => onChange({ maxSizeMB: Number(e.target.value) })}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("allowedExtensions") || "Allowed Extensions"}</Label>
        <Input
          value={(config.allowedExtensions || []).join(", ")}
          onChange={(e) =>
            onChange({
              allowedExtensions: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder={t("extensionsHint") || "e.g. pdf, jpg, png"}
        />
        <p className="text-xs text-muted-foreground">
          {t("extensionsHelp") || "Comma-separated. Leave empty to allow all."}
        </p>
      </div>
    </div>
  );
}
