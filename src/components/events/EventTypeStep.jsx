import { useLanguage } from "../../context/LanguageContext";

/**
 * Ramsha — EventTypeStep
 *
 * Inline event type selection grid. Clicking a card triggers onSelectType.
 * Used inside EventCreationFlow when public mode is active.
 */
const EventTypeStep = ({ selectedType, onSelectType }) => {
  const { t } = useLanguage();

  const eventTypes = [
    { id: "hackathon", name: t("typeHackathon"), icon: "\u{1F3C6}", description: t("typeHackathonDesc") },
    { id: "seminar", name: t("typeSeminar"), icon: "\u{1F3A4}", description: t("typeSeminarDesc") },
    { id: "workshop", name: t("typeWorkshop"), icon: "\u{1F6E0}\u{FE0F}", description: t("typeWorkshopDesc") },
    { id: "training", name: t("typeTraining"), icon: "\u{1F4DA}", description: t("typeTrainingDesc") },
    { id: "conference", name: t("typeConference"), icon: "\u{1F3AF}", description: t("typeConferenceDesc") },
    { id: "other", name: t("typeOther"), icon: "\u{2728}", description: t("typeOtherDesc") },
  ];

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-heading font-black text-xl text-foreground">{t("selectEventType")}</h2>
        <p className="text-muted-foreground font-mono text-sm">{t("selectEventTypeSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {eventTypes.map((type) => {
          const isSelected = selectedType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => onSelectType(type.id)}
              className={`text-start border-2 p-4 transition-colors duration-100 ${
                isSelected
                  ? "border-main bg-main/5"
                  : "border-border bg-secondary-background hover:border-main"
              }`}
            >
              <div className="text-4xl mb-3">{type.icon}</div>
              <h3 className="font-heading font-black text-sm text-foreground mb-2">{type.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{type.description}</p>
              {isSelected && (
                <span className="text-xs font-bold uppercase text-main">
                  ✓ {t("selected")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default EventTypeStep;
