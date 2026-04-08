import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Star, Upload, Languages } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { FIELD_TYPES } from "./formFieldDefaults";

function FieldPreview({ field, previewLang }) {
  const label =
    previewLang === "ar"
      ? field.labelAr || field.label
      : field.label || field.labelAr;
  const description =
    previewLang === "ar"
      ? field.descriptionAr || field.description
      : field.description || field.descriptionAr;
  const dir = previewLang === "ar" ? "rtl" : "ltr";
  const config = field.config || {};

  const renderInput = () => {
    switch (field.type) {
      case "openText":
        return (
          <Input
            disabled
            placeholder={config.placeholder || ""}
            dir={dir}
          />
        );

      case "openTextLong":
        return (
          <Textarea
            disabled
            placeholder={config.placeholder || ""}
            rows={3}
            dir={dir}
          />
        );

      case "multipleChoiceSingle": {
        const choices = config.choices || [];
        return (
          <div className="space-y-2" dir={dir}>
            {choices.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  disabled
                  name={field.id}
                  className="h-4 w-4 accent-main"
                />
                <span>
                  {previewLang === "ar" ? c.labelAr || c.label : c.label}
                </span>
              </label>
            ))}
            {config.allowOther && (
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" disabled className="h-4 w-4 accent-main" />
                <span className="text-muted-foreground italic">
                  {previewLang === "ar" ? "\u0623\u062e\u0631\u0649" : "Other"}
                </span>
              </label>
            )}
          </div>
        );
      }

      case "multipleChoiceMulti": {
        const choices = config.choices || [];
        return (
          <div className="space-y-2" dir={dir}>
            {choices.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled
                  className="h-4 w-4 accent-main rounded"
                />
                <span>
                  {previewLang === "ar" ? c.labelAr || c.label : c.label}
                </span>
              </label>
            ))}
            {config.allowOther && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled
                  className="h-4 w-4 accent-main rounded"
                />
                <span className="text-muted-foreground italic">
                  {previewLang === "ar" ? "\u0623\u062e\u0631\u0649" : "Other"}
                </span>
              </label>
            )}
          </div>
        );
      }

      case "rating": {
        const range = config.range || 5;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              {Array.from({ length: range }, (_, i) => (
                <Star
                  key={i}
                  className="h-6 w-6 text-muted-foreground"
                />
              ))}
            </div>
            {(config.lowerLabel || config.upperLabel) && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{config.lowerLabel}</span>
                <span>{config.upperLabel}</span>
              </div>
            )}
          </div>
        );
      }

      case "date":
        return <Input disabled type="date" dir={dir} />;

      case "fileUpload":
        return (
          <div className="flex items-center gap-2 rounded-base border-2 border-dashed border-border p-4 text-muted-foreground">
            <Upload className="h-5 w-5" />
            <span className="text-sm">
              {previewLang === "ar"
                ? "\u0627\u0633\u062d\u0628 \u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0647\u0646\u0627 \u0623\u0648 \u0627\u0646\u0642\u0631 \u0644\u0644\u062a\u062d\u0645\u064a\u0644"
                : "Drag files here or click to upload"}
            </span>
          </div>
        );

      case "matrix": {
        const rows = config.rows || [];
        const columns = config.columns || [];
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-2 border-border rounded-base">
              <thead>
                <tr>
                  <th className="p-2 border-b-2 border-border" />
                  {columns.map((col) => (
                    <th
                      key={col.id}
                      className="p-2 border-b-2 border-border text-center font-bold"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="p-2 border-b border-border font-bold">
                      {row.label}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className="p-2 border-b border-border text-center"
                      >
                        <input
                          type="radio"
                          disabled
                          className="h-4 w-4 accent-main"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case "ranking": {
        const choices = config.choices || [];
        return (
          <div className="space-y-2" dir={dir}>
            {choices.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-base border-2 border-border bg-background p-2"
              >
                <span className="text-sm font-bold text-muted-foreground w-6 text-center">
                  {idx + 1}
                </span>
                <span className="text-sm">
                  {previewLang === "ar" ? c.labelAr || c.label : c.label}
                </span>
              </div>
            ))}
          </div>
        );
      }

      case "consent": {
        const text =
          previewLang === "ar"
            ? config.consentTextAr || config.consentText
            : config.consentText || config.consentTextAr;
        return (
          <label className="flex items-start gap-2" dir={dir}>
            <input
              type="checkbox"
              disabled
              className="h-4 w-4 mt-0.5 accent-main rounded"
            />
            <span className="text-sm text-foreground">
              {text || (previewLang === "ar" ? "\u0646\u0635 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629" : "Consent text")}
            </span>
          </label>
        );
      }

      default:
        return <Input disabled />;
    }
  };

  return (
    <div className="space-y-2" dir={dir}>
      <div className="flex items-baseline gap-1">
        <span className="text-sm font-bold text-foreground">{label}</span>
        {field.required && (
          <span className="text-red-500 font-bold">*</span>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {renderInput()}
    </div>
  );
}

export default function FormPreview({ fields }) {
  const { t, language } = useLanguage();
  const [previewLang, setPreviewLang] = useState(language || "en");

  if (!fields || fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        {t("noFieldsToPreview") || "No fields to preview yet."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Language toggle */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="noShadow"
          size="sm"
          onClick={() =>
            setPreviewLang((prev) => (prev === "en" ? "ar" : "en"))
          }
          className="gap-1"
        >
          <Languages className="h-3.5 w-3.5" />
          {previewLang === "en" ? "AR" : "EN"}
        </Button>
      </div>

      {/* Field previews */}
      <div className="space-y-6">
        {fields.map((field) => (
          <FieldPreview
            key={field.id}
            field={field}
            previewLang={previewLang}
          />
        ))}
      </div>
    </div>
  );
}
