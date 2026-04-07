import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "../../utils/apiClient";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Users } from "lucide-react";

const VISIBILITY_OPTIONS = [
  {
    value: "public",
    label: "Public",
    description: "Visible to sponsors and recruiters",
    icon: Eye,
  },
  {
    value: "registered-events-only",
    label: "Registered Events Only",
    description: "Only visible within events you've joined",
    icon: Users,
  },
  {
    value: "private",
    label: "Private",
    description: "Not visible to others",
    icon: EyeOff,
  },
];

function ProfileVisibilitySection({ showToast }) {
  const [visibility, setVisibility] = useState("public");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiGet("/api/users/profile");
        setVisibility(data.profileVisibility || "public");
      } catch {
        // handled by parent
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiPatch("/api/users/profile", { profileVisibility: visibility });
      showToast("Visibility updated!");
    } catch (err) {
      showToast(err.message || "Failed to update visibility.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-base border-2 border-border bg-secondary-background p-6 mb-6 shadow-shadow">
        <div className="h-10 animate-pulse rounded-base bg-muted" />
      </section>
    );
  }

  return (
    <section className="rounded-base border-2 border-border bg-secondary-background p-6 mb-6 shadow-shadow">
      <h2 className="font-heading text-lg font-black text-foreground mb-4">Profile Visibility</h2>
      <p className="text-sm text-muted-foreground mb-4">Control who can see your profile information.</p>

      <div className="space-y-3">
        {VISIBILITY_OPTIONS.map((opt) => {
          const isSelected = visibility === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setVisibility(opt.value)}
              className={`flex w-full items-center gap-3 rounded-base border-2 px-4 py-3 text-start transition-colors ${
                isSelected
                  ? "border-main bg-main/10 shadow-neo-sm"
                  : "border-border bg-background hover:bg-card"
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-base border-2 ${
                isSelected ? "border-main bg-main text-main-foreground" : "border-border bg-background text-muted-foreground"
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className={`text-sm font-bold ${isSelected ? "text-foreground" : "text-foreground"}`}>{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="mt-4">
        {isSaving ? "Saving..." : "Save Visibility"}
      </Button>
    </section>
  );
}

export default ProfileVisibilitySection;
