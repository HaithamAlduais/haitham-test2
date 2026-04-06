import { useLanguage } from "../../context/LanguageContext";

/**
 * Ramsha — SessionStatsBar
 *
 * Displays three stat cards (Total Check-ins, Present, Late) for the
 * Provider's live session monitoring view. Uses the same Neo-Brutalist
 * design tokens as the rest of the Ramsha platform.
 *
 * @param {{ total: number, present: number, late: number }} props
 */
const SessionStatsBar = ({ total, present, late }) => {
  const { t } = useLanguage();

  const cards = [
    { label: t('totalCheckIns'), value: total, color: "border-l-main" },
    { label: t('present'), value: present, color: "border-l-main" },
    { label: t('late'), value: late, color: "border-l-amber" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`border-2 border-border bg-secondary-background p-5 border-l-[5px] ${card.color}`}
        >
          <p className="font-mono font-bold text-xs uppercase tracking-[0.12em] text-muted-foreground mb-2">
            {card.label}
          </p>
          <p className="font-display font-black text-3xl text-foreground">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default SessionStatsBar;
