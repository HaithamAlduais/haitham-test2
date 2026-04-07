import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

/**
 * Ramsha — EventTypeStep
 *
 * Inline event type selection grid. Clicking a card triggers onSelectType.
 * Used inside EventCreationFlow when public mode is active.
 */

const COMING_SOON_TYPES = ["hackathon"];

const EventTypeStep = ({ selectedType, onSelectType }) => {
  const { t } = useLanguage();
  const [toast, setToast] = useState(null);

  const eventTypes = [
    { id: "hackathon", name: t("typeHackathon"), icon: "\u{1F3C6}", description: t("typeHackathonDesc") },
    { id: "seminar", name: t("typeSeminar"), icon: "\u{1F3A4}", description: t("typeSeminarDesc") },
    { id: "workshop", name: t("typeWorkshop"), icon: "\u{1F6E0}\u{FE0F}", description: t("typeWorkshopDesc") },
    { id: "training", name: t("typeTraining"), icon: "\u{1F4DA}", description: t("typeTrainingDesc") },
    { id: "conference", name: t("typeConference"), icon: "\u{1F3AF}", description: t("typeConferenceDesc") },
    { id: "other", name: t("typeOther"), icon: "\u{2728}", description: t("typeOtherDesc") },
  ];

  const handleSelect = (type) => {
    if (COMING_SOON_TYPES.includes(type)) {
      setToast(t("comingSoon"));
      setTimeout(() => setToast(null), 2500);
      return;
    }
    onSelectType(type);
  };

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-heading font-black text-xl text-foreground">{t("selectEventType")}</h2>
        <p className="text-muted-foreground font-mono text-sm">{t("selectEventTypeSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {eventTypes.map((type) => {
          const isSelected = selectedType === type.id;
          const isComingSoon = COMING_SOON_TYPES.includes(type.id);
          return (
            <button
              key={type.id}
              onClick={() => handleSelect(type.id)}
              className={`text-start border-2 p-4 transition-colors duration-100 ${
                isSelected
                  ? "border-main bg-main/5"
                  : "border-border bg-secondary-background hover:border-main"
              } ${isComingSoon ? "opacity-60" : ""}`}
            >
              <div className="text-4xl mb-3">{type.icon}</div>
              <h3 className="font-heading font-black text-sm text-foreground mb-2">
                {type.name}
                {isComingSoon && (
                  <span className="ms-2 text-[10px] font-mono font-bold uppercase text-muted-foreground">
                    {t("comingSoon")}
                  </span>
                )}
              </h3>
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

      {toast && (
        <div className="fixed bottom-6 end-6 z-[60] rounded-base border-2 border-main bg-background px-5 py-3 text-sm font-bold shadow-shadow text-foreground">
          {toast}
        </div>
      )}
    </section>
  );
};

export default EventTypeStep;
