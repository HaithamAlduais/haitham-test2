import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CalendarClock, Sparkles } from "lucide-react";

function addDays(dateStr, days) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function generateDefaultTasks(schedule) {
  const regOpen = schedule?.registrationOpen;
  const regClose = schedule?.registrationClose;
  const submissionDeadline = schedule?.submissionDeadline;
  const judgingStart = schedule?.judgingStart;
  const judgingEnd = schedule?.judgingEnd;

  const tasks = [];

  if (regOpen) {
    tasks.push({
      id: crypto.randomUUID(),
      title: "Set up hackathon platform",
      dueDate: addDays(regOpen, -28),
      category: "pre-event",
      completed: false,
    });
    tasks.push({
      id: crypto.randomUUID(),
      title: "Invite judges and mentors",
      dueDate: addDays(regOpen, -21),
      category: "pre-event",
      completed: false,
    });
    tasks.push({
      id: crypto.randomUUID(),
      title: "Launch announcements and marketing",
      dueDate: addDays(regOpen, -14),
      category: "pre-event",
      completed: false,
    });
    tasks.push({
      id: crypto.randomUUID(),
      title: "Finalize sponsors and prizes",
      dueDate: addDays(regOpen, -7),
      category: "pre-event",
      completed: false,
    });
    tasks.push({
      id: crypto.randomUUID(),
      title: "Open registration",
      dueDate: addDays(regOpen, 0),
      category: "pre-event",
      completed: false,
    });
  }

  if (regClose) {
    tasks.push({
      id: crypto.randomUUID(),
      title: "Send reminder to registered participants",
      dueDate: addDays(regClose, -3),
      category: "pre-event",
      completed: false,
    });
    tasks.push({
      id: crypto.randomUUID(),
      title: "Close registration",
      dueDate: addDays(regClose, 0),
      category: "during",
      completed: false,
    });
  }

  if (submissionDeadline) {
    tasks.push({
      id: crypto.randomUUID(),
      title: "Send submission deadline reminder",
      dueDate: addDays(submissionDeadline, -1),
      category: "during",
      completed: false,
    });
    tasks.push({
      id: crypto.randomUUID(),
      title: "Collect final submissions",
      dueDate: addDays(submissionDeadline, 0),
      category: "during",
      completed: false,
    });
  }

  if (judgingStart) {
    tasks.push({
      id: crypto.randomUUID(),
      title: "Distribute submissions to judges",
      dueDate: addDays(judgingStart, 0),
      category: "during",
      completed: false,
    });
  }

  if (judgingEnd) {
    tasks.push({
      id: crypto.randomUUID(),
      title: "Compile judging results",
      dueDate: addDays(judgingEnd, 0),
      category: "post-event",
      completed: false,
    });
    tasks.push({
      id: crypto.randomUUID(),
      title: "Announce winners",
      dueDate: addDays(judgingEnd, 1),
      category: "post-event",
      completed: false,
    });
    tasks.push({
      id: crypto.randomUUID(),
      title: "Distribute prizes",
      dueDate: addDays(judgingEnd, 3),
      category: "post-event",
      completed: false,
    });
    tasks.push({
      id: crypto.randomUUID(),
      title: "Send thank-you emails and collect feedback",
      dueDate: addDays(judgingEnd, 7),
      category: "post-event",
      completed: false,
    });
  }

  return tasks;
}

const CATEGORY_LABELS = {
  "pre-event": "Pre-Event",
  during: "During Event",
  "post-event": "Post-Event",
};

const CATEGORY_COLORS = {
  "pre-event": "text-blue-600",
  during: "text-main",
  "post-event": "text-green-600",
};

export default function WorkbackScheduleStep({ data, onChange, onNext, onBack }) {
  const tasks = data.workbackSchedule || [];
  const [newTask, setNewTask] = useState({
    title: "",
    dueDate: "",
    category: "pre-event",
  });

  const hasScheduleDates =
    data.schedule &&
    (data.schedule.registrationOpen ||
      data.schedule.submissionDeadline ||
      data.schedule.judgingEnd);

  const autoGenerate = () => {
    const generated = generateDefaultTasks(data.schedule || {});
    onChange({ workbackSchedule: generated });
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    onChange({
      workbackSchedule: [
        ...tasks,
        { ...newTask, id: crypto.randomUUID(), completed: false },
      ],
    });
    setNewTask({ title: "", dueDate: "", category: "pre-event" });
  };

  const removeTask = (idx) => {
    onChange({ workbackSchedule: tasks.filter((_, i) => i !== idx) });
  };

  const toggleCompleted = (idx) => {
    const updated = tasks.map((t, i) =>
      i === idx ? { ...t, completed: !t.completed } : t
    );
    onChange({ workbackSchedule: updated });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">Workback Schedule</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan your preparation timeline with tasks leading up to and following the hackathon.
        </p>
      </div>

      {/* Auto-generate button */}
      <div className="rounded-base border-2 border-border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-foreground">Auto-Generate Tasks</p>
            <p className="text-sm text-muted-foreground">
              {hasScheduleDates
                ? "Generate a default timeline based on your schedule dates."
                : "Set schedule dates first to enable auto-generation."}
            </p>
          </div>
          <Button
            variant="neutral"
            size="sm"
            onClick={autoGenerate}
            disabled={!hasScheduleDates}
          >
            <Sparkles className="h-4 w-4" /> Generate
          </Button>
        </div>
      </div>

      {/* Task list */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task, idx) => (
            <div
              key={task.id || idx}
              className="flex items-start gap-3 rounded-base border-2 border-border bg-card p-4"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleCompleted(idx)}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-main"
              />
              <CalendarClock className="h-5 w-5 shrink-0 text-main mt-0.5" />
              <div className="flex-1 min-w-0">
                <p
                  className={`font-bold text-foreground ${
                    task.completed ? "line-through opacity-50" : ""
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex gap-3 mt-1">
                  {task.dueDate && (
                    <p className="text-sm text-muted-foreground">{task.dueDate}</p>
                  )}
                  <span
                    className={`text-sm font-bold ${
                      CATEGORY_COLORS[task.category] || "text-muted-foreground"
                    }`}
                  >
                    {CATEGORY_LABELS[task.category] || task.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeTask(idx)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add custom task */}
      <div className="rounded-base border-2 border-dashed border-border p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Task Title *</Label>
            <Input
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="e.g. Book venue"
            />
          </div>
          <div className="space-y-1">
            <Label>Due Date</Label>
            <Input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <select
              value={newTask.category}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
              className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="pre-event">Pre-Event</option>
              <option value="during">During Event</option>
              <option value="post-event">Post-Event</option>
            </select>
          </div>
        </div>
        <Button
          variant="neutral"
          size="sm"
          onClick={addTask}
          disabled={!newTask.title.trim()}
        >
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext}>Next: Resources →</Button>
      </div>
    </div>
  );
}
