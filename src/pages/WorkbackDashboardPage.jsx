import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
} from "lucide-react";

function classifyTask(task) {
  if (task.completed) return "completed";
  if (!task.dueDate) return "upcoming";
  const due = new Date(task.dueDate);
  const now = new Date();
  if (due < now) return "overdue";
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  if (due < threeDays) return "upcoming";
  return "future";
}

const STATUS_STYLES = {
  overdue: "border-red-500 bg-red-50 dark:bg-red-950/20",
  upcoming: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
  completed: "border-green-500 bg-green-50 dark:bg-green-950/20 opacity-75",
  future: "border-border bg-card",
};

const CATEGORY_LABELS = {
  "pre-event": "Pre-Event",
  during: "During Event",
  "post-event": "Post-Event",
  other: "Other",
};

export default function WorkbackDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { token } = useAuth();
  const [event, setEvent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/hackathons/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEvent(data);
      setTasks(data.workbackSchedule || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  const toggleTask = async (index) => {
    const updated = tasks.map((t, i) =>
      i === index ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);

    try {
      await fetch(`/api/hackathons/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workbackSchedule: updated }),
      });
    } catch {
      // Revert on failure
      setTasks(tasks);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Group tasks by category
  const grouped = {};
  tasks.forEach((task, i) => {
    const cat = task.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ ...task, _index: i });
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>
      <header className="border-b-2 border-border bg-secondary-background">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate(`/hackathons/${id}`)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Manage
          </button>

          <div className="flex items-center gap-3 mb-2">
            <CalendarClock className="h-8 w-8 text-main" />
            <h1 className="font-heading text-2xl md:text-3xl font-black text-foreground">
              Workback Schedule
            </h1>
          </div>
          <p className="text-muted-foreground">{event?.name || event?.title}</p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">
                {completedCount} of {tasks.length} tasks
              </span>
              <span className="font-bold text-foreground">{progress}%</span>
            </div>
            <div className="h-3 w-full rounded-base border-2 border-border bg-card overflow-hidden">
              <div
                className="h-full bg-main transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {tasks.length === 0 && (
          <div className="text-center py-16 rounded-base border-2 border-dashed border-border">
            <CalendarClock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No workback schedule created yet. Generate one from the hackathon creation wizard.
            </p>
          </div>
        )}

        {Object.entries(grouped).map(([category, catTasks]) => (
          <section key={category} className="mb-8">
            <h2 className="text-lg font-black mb-3 flex items-center gap-2">
              {CATEGORY_LABELS[category] || category}
              <Badge variant="neutral" className="text-xs">
                {catTasks.filter((t) => t.completed).length}/{catTasks.length}
              </Badge>
            </h2>
            <div className="space-y-2">
              {catTasks.map((task) => {
                const status = classifyTask(task);
                return (
                  <div
                    key={task._index}
                    className={`flex items-center gap-3 rounded-base border-2 p-3 cursor-pointer transition-colors ${STATUS_STYLES[status]}`}
                    onClick={() => toggleTask(task._index)}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : status === "overdue" ? (
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium ${
                          task.completed
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {task.title || task.task}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}

                    {status === "overdue" && !task.completed && (
                      <Badge className="bg-red-500 text-white text-[10px]">Overdue</Badge>
                    )}
                    {status === "upcoming" && !task.completed && (
                      <Badge className="bg-yellow-500 text-black text-[10px]">Soon</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
