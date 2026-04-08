import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Copy, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { FIELD_TYPES } from "./formFieldDefaults";

export default function FormFieldCard({
  field,
  isActive,
  onClick,
  onDuplicate,
  onDelete,
}) {
  const { language } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldType = FIELD_TYPES.find((ft) => ft.type === field.type);
  const Icon = fieldType?.icon;
  const displayLabel =
    language === "ar"
      ? field.labelAr || field.label || fieldType?.labelAr
      : field.label || fieldType?.labelEn;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-base border-2 border-border bg-card p-3 cursor-pointer transition-all ${
        isActive ? "ring-2 ring-main shadow-shadow" : "hover:shadow-shadow"
      }`}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Type icon */}
      {Icon && <Icon className="h-4 w-4 shrink-0 text-main" />}

      {/* Label */}
      <span className="flex-1 truncate text-sm font-bold text-foreground">
        {displayLabel}
      </span>

      {/* Required badge */}
      {field.required && (
        <span className="shrink-0 rounded-base border-2 border-border bg-main px-2 py-0.5 text-xs font-bold text-main-foreground">
          *
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="rounded-base p-1 text-muted-foreground hover:bg-main hover:text-main-foreground transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded-base p-1 text-muted-foreground hover:bg-red-500 hover:text-white transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
