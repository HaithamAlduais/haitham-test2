import { useLanguage } from "../../context/LanguageContext";

/**
 * Ramsha — HackathonSuccessScreen
 *
 * Shown after a hackathon landing page is successfully generated and published.
 * Displays the live URL with "View Live Page" and "Go to Dashboard" actions.
 */
const HackathonSuccessScreen = ({ slug, onDashboard }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8">
      {/* Checkmark */}
      <div className="w-20 h-20 border-4 border-main flex items-center justify-center">
        <svg
          className="w-10 h-10 text-main"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Title & subtitle */}
      <div className="text-center space-y-2">
        <h2 className="font-heading font-black text-3xl text-foreground">
          {t("yourPageIsLive")}
        </h2>
        <p className="text-muted-foreground font-mono text-sm max-w-md">
          {t("geminiPublishedSubtitle")}
        </p>
      </div>

      {/* Live URL */}
      <div className="w-full max-w-lg border-2 border-border bg-secondary-background px-4 py-3">
        <p className="text-sm font-heading leading-none text-muted-foreground mb-1">
          {t("liveEventUrl")}
        </p>
        <p className="font-mono text-sm text-main break-all">
          ramsha.io/events/{slug}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
        <a
          href={`/events/p/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center bg-main text-main-foreground font-heading font-black text-sm tracking-widest uppercase px-6 py-3 border-2 border-border shadow-shadow transition-colors duration-100"
        >
          {t("viewLivePage")}
        </a>
        <button
          onClick={onDashboard}
          className="flex-1 border-2 border-border px-6 py-3 font-mono font-bold text-sm text-foreground hover:border-main transition-colors duration-100"
        >
          {t("goToDashboard")}
        </button>
      </div>
    </div>
  );
};

export default HackathonSuccessScreen;
