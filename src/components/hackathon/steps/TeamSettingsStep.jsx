import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function TeamSettingsStep({ data, onChange, onNext, onBack }) {
  const settings = data.settings || {};
  const regSettings = data.registrationSettings || {};

  const updateSettings = (key, value) => {
    onChange({ settings: { ...settings, [key]: value } });
  };

  const updateRegSettings = (key, value) => {
    onChange({ registrationSettings: { ...regSettings, [key]: value } });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">Team & Registration Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure team sizes and registration rules.
        </p>
      </div>

      {/* Team size */}
      <div className="space-y-5">
        <h3 className="font-bold text-foreground">Team Size</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Minimum Members</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={settings.teamSizeMin || 2}
              onChange={(e) => updateSettings("teamSizeMin", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Maximum Members</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={settings.teamSizeMax || 5}
              onChange={(e) => updateSettings("teamSizeMax", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={settings.allowSolo || false}
            onCheckedChange={(val) => updateSettings("allowSolo", val)}
          />
          <Label>Allow solo participants (team of 1)</Label>
        </div>
      </div>

      {/* Registration */}
      <div className="space-y-5">
        <h3 className="font-bold text-foreground">Registration</h3>
        <div className="space-y-2">
          <Label>Max Registrants</Label>
          <Input
            type="number"
            min={1}
            value={settings.maxRegistrants || 500}
            onChange={(e) => updateSettings("maxRegistrants", Number(e.target.value))}
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={regSettings.requireApproval !== false}
            onCheckedChange={(val) => updateRegSettings("requireApproval", val)}
          />
          <Label>Require approval for registrations</Label>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>← Back</Button>
        <Button onClick={onNext}>Next: Review →</Button>
      </div>
    </div>
  );
}
