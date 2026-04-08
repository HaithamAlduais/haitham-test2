import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X, Copy, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { FIELD_TYPES } from "./formFieldDefaults";
import OpenTextEditor from "./field-editors/OpenTextEditor";
import MultipleChoiceEditor from "./field-editors/MultipleChoiceEditor";
import RatingEditor from "./field-editors/RatingEditor";
import DateEditor from "./field-editors/DateEditor";
import FileUploadEditor from "./field-editors/FileUploadEditor";
import MatrixEditor from "./field-editors/MatrixEditor";
import RankingEditor from "./field-editors/RankingEditor";
import ConsentEditor from "./field-editors/ConsentEditor";

const TYPE_EDITORS = {
  openText: OpenTextEditor,
  openTextLong: OpenTextEditor,
  multipleChoiceSingle: MultipleChoiceEditor,
  multipleChoiceMulti: MultipleChoiceEditor,
  rating: RatingEditor,
  date: DateEditor,
  fileUpload: FileUploadEditor,
  matrix: MatrixEditor,
  ranking: RankingEditor,
  consent: ConsentEditor,
};

export default function FormFieldEditor({
  field,
  onChange,
  onClose,
  onDuplicate,
  onDelete,
}) {
  const { t } = useLanguage();

  if (!field) return null;

  const fieldType = FIELD_TYPES.find((ft) => ft.type === field.type);
  const TypeEditor = TYPE_EDITORS[field.type];

  const handleConfigChange = (configUpdates) => {
    onChange({ config: { ...field.config, ...configUpdates } });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-foreground">
          {t("editField") || "Edit Field"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-base p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Field type badge */}
      {fieldType && (
        <div className="flex items-center gap-2 rounded-base border-2 border-border bg-background px-3 py-2">
          <fieldType.icon className="h-4 w-4 text-main" />
          <span className="text-sm font-bold text-foreground">
            {fieldType.labelEn}
          </span>
        </div>
      )}

      {/* Common fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t("fieldLabel") || "Label (English)"}</Label>
          <Input
            value={field.label || ""}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder={t("fieldLabelHint") || "Enter field label"}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("fieldLabelAr") || "Label (Arabic)"}</Label>
          <Input
            value={field.labelAr || ""}
            onChange={(e) => onChange({ labelAr: e.target.value })}
            placeholder={t("fieldLabelArHint") || "Enter Arabic label"}
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <Label>{t("fieldDescription") || "Description"}</Label>
          <Textarea
            value={field.description || ""}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder={
              t("fieldDescriptionHint") || "Optional helper text..."
            }
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("fieldDescriptionAr") || "Description (Arabic)"}</Label>
          <Textarea
            value={field.descriptionAr || ""}
            onChange={(e) => onChange({ descriptionAr: e.target.value })}
            placeholder={
              t("fieldDescriptionArHint") || "Optional Arabic helper text..."
            }
            rows={2}
            dir="rtl"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="field-required">
            {t("required") || "Required"}
          </Label>
          <Switch
            id="field-required"
            checked={field.required || false}
            onCheckedChange={(checked) => onChange({ required: checked })}
          />
        </div>
      </div>

      {/* Type-specific editor */}
      {TypeEditor && (
        <div className="border-t-2 border-border pt-4">
          <h4 className="text-xs font-black text-muted-foreground uppercase mb-3">
            {t("typeSettings") || "Type Settings"}
          </h4>
          <TypeEditor config={field.config || {}} onChange={handleConfigChange} />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 border-t-2 border-border pt-4">
        <Button
          type="button"
          variant="noShadow"
          size="sm"
          onClick={onDuplicate}
          className="gap-1 flex-1"
        >
          <Copy className="h-3.5 w-3.5" />
          {t("duplicate") || "Duplicate"}
        </Button>
        <Button
          type="button"
          variant="noShadow"
          size="sm"
          onClick={onDelete}
          className="gap-1 flex-1 text-red-600 hover:bg-red-500 hover:text-white"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t("delete") || "Delete"}
        </Button>
      </div>
    </div>
  );
}
