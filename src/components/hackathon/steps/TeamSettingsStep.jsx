import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "radio", label: "Radio Buttons" },
];

function CustomFieldEditor({ fields, onChange }) {
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");

  const addField = () => {
    if (!newFieldLabel.trim()) return;
    const id = `cf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const field = {
      id,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: false,
      options: [],
    };
    onChange([...fields, field]);
    setNewFieldLabel("");
    setNewFieldType("text");
  };

  const updateField = (index, updates) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeField = (index) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const addOption = (index) => {
    const field = fields[index];
    const opts = [...(field.options || []), ""];
    updateField(index, { options: opts });
  };

  const updateOption = (fieldIndex, optIndex, value) => {
    const field = fields[fieldIndex];
    const opts = [...(field.options || [])];
    opts[optIndex] = value;
    updateField(fieldIndex, { options: opts });
  };

  const removeOption = (fieldIndex, optIndex) => {
    const field = fields[fieldIndex];
    const opts = (field.options || []).filter((_, i) => i !== optIndex);
    updateField(fieldIndex, { options: opts });
  };

  return (
    <div className="space-y-4">
      {/* Existing fields */}
      {fields.map((field, idx) => (
        <div key={field.id} className="rounded-base border-2 border-border bg-background p-4 space-y-3">
          <div className="flex items-center gap-3">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{field.label}</p>
              <p className="text-xs text-muted-foreground capitalize">{field.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={field.required || false}
                  onChange={(e) => updateField(idx, { required: e.target.checked })}
                  className="h-3.5 w-3.5 accent-main"
                />
                Required
              </label>
              <button onClick={() => removeField(idx)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Options editor for select/radio */}
          {(field.type === "select" || field.type === "radio") && (
            <div className="ms-7 space-y-2">
              <p className="text-xs font-bold text-muted-foreground">Options:</p>
              {(field.options || []).map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                    placeholder={`Option ${optIdx + 1}`}
                    className="h-8 text-xs"
                  />
                  <button onClick={() => removeOption(idx, optIdx)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(idx)}
                className="text-xs font-bold text-main hover:underline"
              >
                + Add Option
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add new field */}
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Field Label</Label>
          <Input
            value={newFieldLabel}
            onChange={(e) => setNewFieldLabel(e.target.value)}
            placeholder="e.g. T-Shirt Size"
            className="h-9"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addField(); } }}
          />
        </div>
        <div className="w-32 space-y-1">
          <Label className="text-xs">Type</Label>
          <select
            value={newFieldType}
            onChange={(e) => setNewFieldType(e.target.value)}
            className="flex h-9 w-full rounded-base border-2 border-border bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
          >
            {FIELD_TYPES.map((ft) => (
              <option key={ft.value} value={ft.value}>{ft.label}</option>
            ))}
          </select>
        </div>
        <Button type="button" variant="neutral" size="sm" onClick={addField} disabled={!newFieldLabel.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function TeamSettingsStep({ data, onChange, onNext, onBack }) {
  const settings = data.settings || {};
  const regSettings = data.registrationSettings || {};
  const customFields = regSettings.customFields || [];

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
          Configure team sizes, registration rules, and custom form fields.
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

      {/* Custom Registration Fields */}
      <div className="space-y-5">
        <div>
          <h3 className="font-bold text-foreground">Custom Registration Fields</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add custom questions to the registration form. These appear after the default fields.
          </p>
        </div>
        <CustomFieldEditor
          fields={customFields}
          onChange={(fields) => updateRegSettings("customFields", fields)}
        />
      </div>

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>&#8592; Back</Button>
        <Button onClick={onNext}>Next &#8594;</Button>
      </div>
    </div>
  );
}
