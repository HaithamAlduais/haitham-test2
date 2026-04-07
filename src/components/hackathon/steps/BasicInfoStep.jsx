import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Monitor, MapPin, Laptop } from "lucide-react";

const FORMAT_OPTIONS = [
  { value: "online", label: "Online", icon: Monitor },
  { value: "in-person", label: "In-Person", icon: MapPin },
  { value: "hybrid", label: "Hybrid", icon: Laptop },
];

export default function BasicInfoStep({ data, onChange, onNext }) {
  const canProceed = data.title.trim().length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">Basic Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Give your hackathon a name and describe what it's about.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Hackathon Title *</Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g. AI Innovation Hackathon 2026"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input
            id="tagline"
            value={data.tagline}
            onChange={(e) => onChange({ tagline: e.target.value })}
            placeholder="A short catchy phrase for your hackathon"
          />
        </div>

        <div className="space-y-2">
          <Label>Format</Label>
          <div className="flex gap-2">
            {FORMAT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ format: value })}
                className={`flex items-center gap-2 rounded-base border-2 px-4 py-2 text-sm font-bold transition-colors ${
                  (data.format || "online") === value
                    ? "border-border bg-main text-main-foreground shadow-neo-sm"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Describe the hackathon, its goals, target audience, and what participants will build..."
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rules">Rules & Code of Conduct</Label>
          <Textarea
            id="rules"
            value={data.rules}
            onChange={(e) => onChange({ rules: e.target.value })}
            placeholder="Participation rules, code of conduct, submission guidelines..."
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed}>
          Next: Schedule →
        </Button>
      </div>
    </div>
  );
}
