import { useNavigate } from "react-router-dom";
import { formatDate } from "../../utils/formatDate";
import { useLanguage } from "../../context/LanguageContext";

/**
 * Status configuration — maps session status to visual properties.
 * Used by the SessionCard to render status badges and left-border colors
 * following Ramsha's Neo-Brutalist design system.
 */
const STATUS_CONFIG = {
  draft: {
    label: "DRAFT",
    border: "border-l-border",
    badge: "bg-border text-secondary-background",
    dot: false,
  },
  active: {
    label: "ACTIVE",
    border: "border-l-main",
    badge: "bg-main text-foreground",
    dot: true,
  },
  closed: {
    label: "CLOSED",
    border: "border-l-red",
    badge: "bg-destructive/20 text-destructive",
    dot: false,
  },
};

/**
 * SVG icon for QR Code session type.
 */
const QrIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="square"
    className="w-4 h-4"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="3" height="3" />
    <rect x="18" y="18" width="3" height="3" />
  </svg>
);

/**
 * SVG icon for Face to Face (location pin) session type.
 */
const LocationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="square"
    className="w-4 h-4"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <rect x="10" y="7" width="4" height="4" />
  </svg>
);

/**
 * SessionCard — displays a single session's summary for the Provider.
 *
 * Features a color-coded left border and status badge based on
 * session status (draft / active / closed), a session type indicator,
 * truncated notes, and creation date. Clicking navigates to the
 * session detail page.
 *
 * @param {{ session: Object }} props
 */
const SessionCard = ({ session, linkedEventName = null }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const config = STATUS_CONFIG[session.status] || STATUS_CONFIG.draft;

  const typeLabel = session.sessionType === "qr_code" ? t('qrCode') : t('faceToFace');
  const TypeIcon = session.sessionType === "qr_code" ? QrIcon : LocationIcon;

  return (
    <button
      type="button"
      onClick={() => navigate(`/sessions/${session.id}`)}
      className={`
        w-full text-start border-2 border-border bg-secondary-background p-5
        border-l-[5px] ${config.border}
        transition-all duration-100
        hover:shadow-shadow hover:-translate-y-0.5
        focus:outline-none focus:border-main
        cursor-pointer
      `}
    >
      {/* Title */}
      <h3 className="font-display font-bold text-lg text-foreground mb-3 leading-tight">
        {session.title}
      </h3>

      {/* Status badge + session type */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Status pill */}
        <span
          className={`
            inline-flex items-center gap-1.5 px-2 py-0.5
            font-mono font-bold text-xs uppercase tracking-[0.12em]
            ${config.badge}
          `}
        >
          {config.dot && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full bg-foreground opacity-40" />
              <span className="relative inline-flex h-2 w-2 bg-foreground" />
            </span>
          )}
          {config.label}
        </span>

        {/* Session type */}
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-border text-muted-foreground font-mono text-xs uppercase tracking-[0.08em]">
          <TypeIcon />
          {typeLabel}
        </span>
      </div>

      {/* Linked event indicator (integrated, no border) */}
      {linkedEventName && (
        <p className="font-mono text-xs text-main mb-3 inline-flex items-center gap-1.5">
          <span aria-hidden>🔗</span>
          <span className="uppercase tracking-[0.08em] font-bold">{t('linkedEvent')}:</span>
          <span className="text-foreground">{linkedEventName}</span>
        </p>
      )}

      {/* Notes (truncated to 2 lines) */}
      {session.notes && (
        <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
          {session.notes}
        </p>
      )}

      {/* Creation date */}
      <p className="font-mono text-xs text-muted-foreground tracking-wide">
        {formatDate(session.createdAt)}
      </p>
    </button>
  );
};

export default SessionCard;
