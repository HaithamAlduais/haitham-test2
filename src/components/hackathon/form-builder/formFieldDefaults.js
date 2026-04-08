import {
  Type,
  AlignLeft,
  CircleDot,
  CheckSquare,
  Star,
  Calendar,
  Upload,
  Grid3x3,
  ListOrdered,
  ShieldCheck,
} from "lucide-react";

export const FIELD_TYPES = [
  { type: "openText", labelEn: "Short Text", labelAr: "\u0646\u0635 \u0642\u0635\u064a\u0631", icon: Type },
  { type: "openTextLong", labelEn: "Long Text", labelAr: "\u0646\u0635 \u0637\u0648\u064a\u0644", icon: AlignLeft },
  { type: "multipleChoiceSingle", labelEn: "Single Choice", labelAr: "\u0627\u062e\u062a\u064a\u0627\u0631 \u0648\u0627\u062d\u062f", icon: CircleDot },
  { type: "multipleChoiceMulti", labelEn: "Multiple Choice", labelAr: "\u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u062a\u0639\u062f\u062f", icon: CheckSquare },
  { type: "rating", labelEn: "Rating", labelAr: "\u062a\u0642\u064a\u064a\u0645", icon: Star },
  { type: "date", labelEn: "Date", labelAr: "\u062a\u0627\u0631\u064a\u062e", icon: Calendar },
  { type: "fileUpload", labelEn: "File Upload", labelAr: "\u0631\u0641\u0639 \u0645\u0644\u0641", icon: Upload },
  { type: "matrix", labelEn: "Matrix", labelAr: "\u0645\u0635\u0641\u0648\u0641\u0629", icon: Grid3x3 },
  { type: "ranking", labelEn: "Ranking", labelAr: "\u062a\u0631\u062a\u064a\u0628", icon: ListOrdered },
  { type: "consent", labelEn: "Consent", labelAr: "\u0645\u0648\u0627\u0641\u0642\u0629", icon: ShieldCheck },
];

const CONFIG_DEFAULTS = {
  openText: () => ({ inputType: "text", longAnswer: false, placeholder: "" }),
  openTextLong: () => ({ inputType: "text", longAnswer: true, placeholder: "" }),
  multipleChoiceSingle: () => ({
    choices: [{ id: crypto.randomUUID(), label: "Option 1", labelAr: "\u062e\u064a\u0627\u0631 1" }],
    allowOther: false,
  }),
  multipleChoiceMulti: () => ({
    choices: [{ id: crypto.randomUUID(), label: "Option 1", labelAr: "\u062e\u064a\u0627\u0631 1" }],
    allowOther: false,
  }),
  rating: () => ({ scale: "star", range: 5, lowerLabel: "", upperLabel: "" }),
  date: () => ({ format: "y-M-d" }),
  fileUpload: () => ({ allowMultiple: false, maxSizeMB: 10, allowedExtensions: [] }),
  matrix: () => ({
    rows: [{ id: crypto.randomUUID(), label: "Row 1" }],
    columns: [{ id: crypto.randomUUID(), label: "Column 1" }],
  }),
  ranking: () => ({
    choices: [{ id: crypto.randomUUID(), label: "Item 1", labelAr: "\u0639\u0646\u0635\u0631 1" }],
  }),
  consent: () => ({ consentText: "", consentTextAr: "" }),
};

export function createDefaultField(type) {
  const fieldType = FIELD_TYPES.find((ft) => ft.type === type);
  if (!fieldType) return null;

  return {
    id: crypto.randomUUID(),
    type,
    label: fieldType.labelEn,
    labelAr: fieldType.labelAr,
    required: false,
    description: "",
    descriptionAr: "",
    config: CONFIG_DEFAULTS[type](),
  };
}
