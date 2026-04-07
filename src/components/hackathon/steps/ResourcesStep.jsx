import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, FileText, Package } from "lucide-react";

const RESOURCE_TYPES = [
  { value: "template", label: "Template" },
  { value: "dataset", label: "Dataset" },
  { value: "api_doc", label: "API Documentation" },
  { value: "guide", label: "Guide" },
  { value: "tool", label: "Tool" },
  { value: "credits", label: "Credits" },
];

export default function ResourcesStep({ data, onChange, onNext, onBack }) {
  const resources = data.resources || [];
  const [newResource, setNewResource] = useState({
    title: "",
    type: "template",
    url: "",
    description: "",
    autoSendOnAccept: false,
  });

  const addResource = () => {
    if (!newResource.title.trim()) return;
    onChange({
      resources: [...resources, { ...newResource, id: crypto.randomUUID() }],
    });
    setNewResource({
      title: "",
      type: "template",
      url: "",
      description: "",
      autoSendOnAccept: false,
    });
  };

  const removeResource = (idx) => {
    onChange({ resources: resources.filter((_, i) => i !== idx) });
  };

  const toggleAutoSend = (idx) => {
    const updated = resources.map((r, i) =>
      i === idx ? { ...r, autoSendOnAccept: !r.autoSendOnAccept } : r
    );
    onChange({ resources: updated });
  };

  const starterKitItems = resources.filter((r) => r.autoSendOnAccept);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground">Resources</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add resources and starter kit items for participants. Toggle auto-send to
          include in the acceptance starter kit.
        </p>
      </div>

      {/* Resource list */}
      {resources.length > 0 && (
        <div className="space-y-3">
          {resources.map((resource, idx) => (
            <div
              key={resource.id || idx}
              className="flex items-start gap-3 rounded-base border-2 border-border bg-card p-4"
            >
              <FileText className="h-5 w-5 shrink-0 text-main mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">{resource.title}</p>
                <p className="text-sm text-main font-bold">
                  {RESOURCE_TYPES.find((t) => t.value === resource.type)?.label ||
                    resource.type}
                </p>
                {resource.url && (
                  <p className="text-sm text-muted-foreground truncate">
                    {resource.url}
                  </p>
                )}
                {resource.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {resource.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <Switch
                    id={`auto-send-${idx}`}
                    checked={resource.autoSendOnAccept}
                    onCheckedChange={() => toggleAutoSend(idx)}
                  />
                  <Label
                    htmlFor={`auto-send-${idx}`}
                    className="text-xs cursor-pointer"
                  >
                    Include in starter kit
                  </Label>
                </div>
              </div>
              <button
                onClick={() => removeResource(idx)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add resource form */}
      <div className="rounded-base border-2 border-dashed border-border p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input
              value={newResource.title}
              onChange={(e) =>
                setNewResource({ ...newResource, title: e.target.value })
              }
              placeholder="e.g. Starter Template Repo"
            />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <select
              value={newResource.type}
              onChange={(e) =>
                setNewResource({ ...newResource, type: e.target.value })
              }
              className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>URL</Label>
            <Input
              value={newResource.url}
              onChange={(e) =>
                setNewResource({ ...newResource, url: e.target.value })
              }
              placeholder="https://github.com/..."
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input
              value={newResource.description}
              onChange={(e) =>
                setNewResource({ ...newResource, description: e.target.value })
              }
              placeholder="Brief description"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="new-auto-send"
            checked={newResource.autoSendOnAccept}
            onCheckedChange={(checked) =>
              setNewResource({ ...newResource, autoSendOnAccept: checked })
            }
          />
          <Label htmlFor="new-auto-send" className="text-sm cursor-pointer">
            Auto-send on acceptance
          </Label>
        </div>
        <Button
          variant="neutral"
          size="sm"
          onClick={addResource}
          disabled={!newResource.title.trim()}
        >
          <Plus className="h-4 w-4" /> Add Resource
        </Button>
      </div>

      {/* Starter kit preview */}
      {starterKitItems.length > 0 && (
        <div className="rounded-base border-2 border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-main" />
            <p className="font-bold text-foreground">Starter Kit Preview</p>
          </div>
          <p className="text-sm text-muted-foreground">
            These resources will be automatically sent to accepted participants.
          </p>
          <ul className="space-y-1">
            {starterKitItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-main shrink-0" />
                <span className="font-bold text-foreground">{item.title}</span>
                <span className="text-muted-foreground">
                  ({RESOURCE_TYPES.find((t) => t.value === item.type)?.label || item.type})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="neutral" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext}>Next: Branding →</Button>
      </div>
    </div>
  );
}
