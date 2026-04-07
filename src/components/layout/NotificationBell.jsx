import { useEffect, useRef, useState } from "react";
import { apiGet, apiPatch, apiPost } from "@/utils/apiClient";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, Info, Trophy, Users, AlertCircle } from "lucide-react";

const TYPE_ICONS = {
  info: Info,
  team: Users,
  winner: Trophy,
  warning: AlertCircle,
};

function timeAgo(ts) {
  if (!ts) return "";
  const seconds = ts._seconds || ts.seconds;
  if (!seconds) return "";
  const diff = Math.floor((Date.now() - seconds * 1000) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiGet("/api/notifications");
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkRead = async (notifId) => {
    try {
      await apiPatch(`/api/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await apiPost("/api/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="nav"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-border bg-main px-1 text-[10px] font-black text-main-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-80 rounded-base border-2 border-border bg-secondary-background shadow-shadow">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-border px-4 py-3">
            <h3 className="text-sm font-black text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="flex items-center gap-1 text-xs font-bold text-main hover:underline"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = TYPE_ICONS[notif.type] || Info;
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 border-b border-border px-4 py-3 transition-colors ${
                      notif.read ? "opacity-60" : "bg-main/5"
                    }`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-base border-2 ${
                      notif.read ? "border-border bg-background" : "border-main bg-main/10"
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{notif.title}</p>
                      {notif.body && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="mt-1 shrink-0 text-muted-foreground hover:text-main"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
