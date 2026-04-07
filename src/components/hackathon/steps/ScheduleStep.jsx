import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const FIELDS = [
  { key: "registrationOpen", label: "Registration Opens" },
  { key: "registrationClose", label: "Registration Closes" },
  { key: "submissionDeadline", label: "Submission Deadline" },
  { key: "judgingStart", label: "Judging Starts" },
  { key: "judgingEnd", label: "Judging Ends" },
];

export default function ScheduleStep({ data, onChange, onNext, onBack }) {
  const schedule = data.schedule || {};

  const updateSchedule = (key, value) => {
    onChange({ schedule: { ...schedule, [key]: value } });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">Schedule</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the key dates and deadlines for your hackathon.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {FIELDS.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type="datetime-local"
              value={schedule[key] || ""}
              onChange={(e) => updateSchedule(key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext}>
          Next: Tracks →
        </Button>
      </div>
    </div>
  );
}
