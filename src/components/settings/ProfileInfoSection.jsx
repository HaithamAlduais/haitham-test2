import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { apiGet, apiPatch } from "../../utils/apiClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function ProfileInfoSection({ showToast }) {
  const { currentUser, userRole } = useAuth();
  const { t } = useLanguage();

  const [displayName, setDisplayName] = useState("");
  const [createdAt, setCreatedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiGet("/api/users/profile");
        setDisplayName(data.displayName || "");
        setCreatedAt(data.createdAt);
      } catch {
        showToast(t("profileLoadFailed"), "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [showToast, t]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) { showToast(t("nameEmpty"), "error"); return; }
    if (displayName.trim().length > 255) { showToast(t("nameTooLong"), "error"); return; }
    setIsSaving(true);
    try {
      await apiPatch("/api/users/profile", { displayName: displayName.trim() });
      showToast(t("profileUpdated"));
    } catch (err) {
      showToast(err.message || t("profileUpdateFailed"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <section className="rounded-base border-2 border-border bg-secondary-background p-6 mb-6 shadow-shadow">
      <h2 className="font-heading text-lg font-black text-foreground mb-4">{t("profileInformation")}</h2>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-10 animate-pulse rounded-base bg-muted" />
          <div className="h-10 animate-pulse rounded-base bg-muted" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">{t("displayName")}</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={255}
              placeholder={t("displayNamePlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("email")}</Label>
            <div className="flex h-10 w-full items-center rounded-base border-2 border-border bg-background px-3 text-sm text-muted-foreground">
              {currentUser?.email}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("role")}</Label>
            <span className="inline-block w-fit rounded-base border-2 border-main bg-main/10 px-3 py-1 text-xs font-bold uppercase text-main">
              {userRole}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("accountCreated")}</Label>
            <span className="text-sm text-foreground">{formatDate(createdAt)}</span>
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? t("saving") : t("saveChanges")}
          </Button>
        </form>
      )}
    </section>
  );
}

export default ProfileInfoSection;
