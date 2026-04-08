import { useLanguage } from "@/context/LanguageContext";
import { FIELD_TYPES } from "./formFieldDefaults";

export default function FormBuilderSidebar({ onAddField }) {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-black text-foreground mb-3">
        {t("addField") || "Add Field"}
      </h3>
      {FIELD_TYPES.map((ft) => {
        const Icon = ft.icon;
        return (
          <button
            key={ft.type}
            type="button"
            onClick={() => onAddField(ft.type)}
            className="flex w-full items-center gap-2 rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-bold text-foreground transition-colors hover:bg-main hover:text-main-foreground active:translate-x-boxShadowX active:translate-y-boxShadowY"
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {language === "ar" ? ft.labelAr : ft.labelEn}
            </span>
          </button>
        );
      })}
    </div>
  );
}
