import { useEffect, useState } from "react";
import { apiGet } from "@/utils/apiClient";

export default function BadgeGrid() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/api/hackathons/badges/mine")
      .then((data) => setBadges(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-20 bg-muted rounded-base" />;
  if (badges.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Badges & Achievements</h3>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-2 rounded-base border-2 border-border bg-card px-3 py-2 shadow-neo-sm"
            title={`${badge.label} - ${badge.eventTitle || badge.eventId}`}
          >
            <span className="text-lg">{badge.icon}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{badge.label}</p>
              {badge.eventTitle && (
                <p className="text-[10px] text-muted-foreground truncate">{badge.eventTitle}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
