import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, FileText } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import useFormBuilder from "./useFormBuilder";
import FormBuilderSidebar from "./FormBuilderSidebar";
import FormFieldCard from "./FormFieldCard";
import FormFieldEditor from "./FormFieldEditor";
import { FIELD_TYPES } from "./formFieldDefaults";

export default function FormBuilder({ fields: initialFields, onChange }) {
  const { t } = useLanguage();

  const stableOnChange = useCallback(
    (newFields) => {
      if (onChange) onChange(newFields);
    },
    [onChange]
  );

  const { fields, activeFieldId, setActiveFieldId, dispatch } = useFormBuilder(
    initialFields || [],
    stableOnChange
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      dispatch({
        type: "REORDER_FIELDS",
        activeId: active.id,
        overId: over.id,
      });
    }
  };

  const handleAddField = (type) => {
    dispatch({ type: "ADD_FIELD", fieldType: type });
  };

  const activeField = fields.find((f) => f.id === activeFieldId);

  const handleFieldUpdate = (updates) => {
    if (!activeFieldId) return;
    dispatch({ type: "UPDATE_FIELD", id: activeFieldId, updates });
  };

  const handleDuplicate = (id) => {
    dispatch({ type: "DUPLICATE_FIELD", id });
  };

  const handleDelete = (id) => {
    if (activeFieldId === id) setActiveFieldId(null);
    dispatch({ type: "REMOVE_FIELD", id });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4">
        {/* Sidebar - hidden on mobile */}
        <div className="w-48 shrink-0 hidden lg:block">
          <FormBuilderSidebar onAddField={handleAddField} />
        </div>

        {/* Field cards area */}
        <div className="flex-1 min-w-0">
          {fields.length === 0 ? (
            <div className="text-center py-16 rounded-base border-2 border-dashed border-border space-y-4">
              <FileText className="h-12 w-12 text-main mx-auto" />
              <h3 className="text-lg font-black text-foreground">
                {t("emptyFormTitle") || "Start Building Your Form"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {t("emptyFormDescription") ||
                  "Add fields from the sidebar or use the button below to start creating your registration form."}
              </p>
              {/* Mobile add button when empty */}
              <div className="lg:hidden flex flex-wrap justify-center gap-2 pt-2">
                {FIELD_TYPES.slice(0, 4).map((ft) => {
                  const Icon = ft.icon;
                  return (
                    <Button
                      key={ft.type}
                      type="button"
                      variant="noShadow"
                      size="sm"
                      onClick={() => handleAddField(ft.type)}
                      className="gap-1"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {ft.labelEn}
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field) => (
                  <FormFieldCard
                    key={field.id}
                    field={field}
                    isActive={field.id === activeFieldId}
                    onClick={() => setActiveFieldId(field.id)}
                    onDuplicate={() => handleDuplicate(field.id)}
                    onDelete={() => handleDelete(field.id)}
                  />
                ))}
              </SortableContext>
            </div>
          )}

          {/* Mobile floating add button */}
          {fields.length > 0 && (
            <div className="lg:hidden mt-4">
              <MobileAddMenu onAddField={handleAddField} />
            </div>
          )}
        </div>

        {/* Editor panel - visible on desktop when a field is selected */}
        {activeField && (
          <div className="w-80 shrink-0 hidden lg:block">
            <div className="rounded-base border-2 border-border bg-card p-4 sticky top-4">
              <FormFieldEditor
                field={activeField}
                onChange={handleFieldUpdate}
                onClose={() => setActiveFieldId(null)}
                onDuplicate={() => handleDuplicate(activeFieldId)}
                onDelete={() => handleDelete(activeFieldId)}
              />
            </div>
          </div>
        )}

        {/* Editor sheet on mobile */}
        <Sheet
          open={!!activeField && typeof window !== "undefined" && window.innerWidth < 1024}
          onOpenChange={(open) => {
            if (!open) setActiveFieldId(null);
          }}
        >
          <SheetContent side="right" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("editField") || "Edit Field"}</SheetTitle>
            </SheetHeader>
            {activeField && (
              <div className="mt-4">
                <FormFieldEditor
                  field={activeField}
                  onChange={handleFieldUpdate}
                  onClose={() => setActiveFieldId(null)}
                  onDuplicate={() => handleDuplicate(activeFieldId)}
                  onDelete={() => handleDelete(activeFieldId)}
                />
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DndContext>
  );
}

/** Simple expandable add menu for mobile */
function MobileAddMenu({ onAddField }) {
  const { t, language } = useLanguage();

  return (
    <details className="group">
      <summary className="flex items-center justify-center gap-2 cursor-pointer rounded-base border-2 border-dashed border-border py-3 text-sm font-bold text-muted-foreground hover:border-main hover:text-main transition-colors list-none">
        <Plus className="h-4 w-4" />
        {t("addField") || "Add Field"}
      </summary>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {FIELD_TYPES.map((ft) => {
          const Icon = ft.icon;
          return (
            <button
              key={ft.type}
              type="button"
              onClick={() => onAddField(ft.type)}
              className="flex items-center gap-2 rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-bold text-foreground hover:bg-main hover:text-main-foreground transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {language === "ar" ? ft.labelAr : ft.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </details>
  );
}
