import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

/**
 * Ramsha — EventSuccessScreen
 *
 * Success screen for non-hackathon-public events.
 * Public: checkmark + live URL + "View Event Page" + "Go to Dashboard"
 * Private: lock icon + copyable private link + "Go to Dashboard"
 */
const EventSuccessScreen = ({ visibility, eventId, onDashboard }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const isPublic = visibility === "public";
  const liveUrl = `ramsha.io/events/${eventId}`;
  const privateUrl = `ramsha.io/events/${eventId}?access=private`;

  const handleCopy = () => {
    navigator.clipboard.writeText(privateUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8">
      {/* Icon */}
      <div className={`w-20 h-20 border-4 flex items-center justify-center ${isPublic ? "border-main" : "border-border"}`}>
        {isPublic ? (
          <svg className="w-10 h-10 text-main" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="0" strokeLinejoin="miter" />
            <path strokeLinecap="square" strokeLinejoin="miter" d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        )}
      </div>

      {/* Title & subtitle */}
      <div className="text-center space-y-2">
        <h2 className="font-heading font-black text-3xl text-foreground">
          {isPublic ? t("eventPublishedTitle") : t("eventSavedPrivateTitle")}
        </h2>
        <p className="text-muted-foreground font-mono text-sm max-w-md">
          {isPublic ? t("eventPublishedSubtitle") : t("eventSavedPrivateSubtitle")}
        </p>
      </div>

      {/* Public: live URL display */}
      {isPublic && (
        <div className="w-full max-w-lg border-2 border-border bg-secondary-background px-4 py-3">
          <p className="text-sm font-heading leading-none text-muted-foreground mb-1">
            {t("liveEventUrl")}
          </p>
          <p className="font-mono text-sm text-main break-all">{liveUrl}</p>
        </div>
      )}

      {/* Private: copyable link */}
      {!isPublic && (
        <div className="w-full max-w-lg space-y-2">
          <p className="text-sm font-heading leading-none text-muted-foreground">
            {t("privateLink")}
          </p>
          <div className="flex items-stretch border-2 border-border">
            <span className="flex-1 bg-secondary-background px-4 py-3 font-mono text-sm text-main break-all">
              {privateUrl}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 border-l-2 border-border bg-secondary-background px-4 text-xs font-bold uppercase text-muted-foreground hover:text-main hover:border-main transition-colors duration-100"
            >
              {copied ? t("linkCopied") : t("copyLink")}
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
        {isPublic && (
          <a
            href={`/events/${eventId}`}
            className="flex-1 text-center bg-main text-main-foreground font-heading font-black text-sm tracking-widest uppercase px-6 py-3 border-2 border-border shadow-shadow transition-colors duration-100"
          >
            {t("viewEventPage")}
          </a>
        )}
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

export default EventSuccessScreen;
