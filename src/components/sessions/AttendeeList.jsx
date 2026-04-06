import { formatTime } from "../../utils/formatDate";
import { useLanguage } from "../../context/LanguageContext";

/**
 * Ramsha — AttendeeList
 *
 * Displays the live list of Participant check-ins for a session.
 * Each row shows the Participant's name, email, status badge
 * (present / late), and check-in time.
 *
 * @param {{ attendance: Array, isActive: boolean }} props
 *   - attendance: Array of attendance record objects
 *   - isActive: Whether the session is currently active (controls empty state text)
 */
const BADGE = {
  present: "bg-main text-foreground",
  late: "bg-amber text-foreground",
};

const AttendeeList = ({ attendance, isActive }) => {
  const { t } = useLanguage();

  if (attendance.length === 0) {
    return (
      <div className="border-2 border-border bg-secondary-background p-8 text-center">
        <p className="font-display font-bold text-lg text-foreground mb-1">
          {isActive ? t('noCheckInsYet') : t('noAttendanceRecords')}
        </p>
        <p className="font-mono text-sm text-muted-foreground">
          {isActive
            ? t('waitingForParticipants')
            : t('noParticipantsCheckedIn')}
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-border bg-secondary-background">
      {/* Header row — hidden on mobile */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b-2 border-border bg-card">
        <span className="font-mono font-bold text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {t('participant')}
        </span>
        <span className="font-mono font-bold text-xs uppercase tracking-[0.12em] text-muted-foreground">
          EMAIL
        </span>
        <span className="font-mono font-bold text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {t('status')}
        </span>
        <span className="font-mono font-bold text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {t('time')}
        </span>
      </div>

      {/* Rows */}
      {attendance.map((record) => (
        <div
          key={record.id}
          className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 sm:gap-4 px-5 py-4 border-b border-border last:border-b-0 items-center"
        >
          {/* Name */}
          <p className="font-mono font-bold text-sm text-foreground">
            {record.participantName || "Unknown"}
          </p>

          {/* Email */}
          <p className="font-mono text-sm text-muted-foreground truncate">
            {record.participantEmail || "—"}
          </p>

          {/* Status badge */}
          <span
            className={`inline-flex items-center justify-center px-2 py-0.5 font-mono font-bold text-xs uppercase tracking-[0.08em] w-fit ${
              BADGE[record.status] || "bg-border text-background"
            }`}
          >
            {record.status}
          </span>

          {/* Check-in time */}
          <p className="font-mono text-xs text-muted-foreground">
            {formatTime(record.attendanceTime)}
          </p>
        </div>
      ))}
    </div>
  );
};

export default AttendeeList;
