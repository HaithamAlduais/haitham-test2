import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { apiGet, apiPatch, apiPost } from "../../utils/apiClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

function ProfileInfoSection({ showToast }) {
  const { currentUser, userRole } = useAuth();
  const { t } = useLanguage();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiGet("/api/users/profile");
        setDisplayName(data.displayName || "");
        setAvatarUrl(data.avatarUrl || null);
        setCreatedAt(data.createdAt);
      } catch {
        showToast(t("profileLoadFailed"), "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [showToast, t]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5 MB.", "error");
      return;
    }
    setUploadingAvatar(true);
    try {
      const { uploadUrl, downloadURL } = await apiPost("/api/upload/presigned-url", {
        fileName: file.name,
        contentType: file.type,
        fileType: "avatars",
        fileId: currentUser.uid,
      });
      await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      await apiPatch("/api/users/profile", { avatarUrl: downloadURL });
      setAvatarUrl(downloadURL);
      showToast("Avatar updated!");
    } catch (err) {
      showToast(err.message || "Avatar upload failed.", "error");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full border-2 border-border object-cover shadow-neo-sm" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-border bg-main text-2xl font-black text-main-foreground shadow-neo-sm">
                  {currentUser?.email?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -end-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background shadow-neo-sm hover:bg-card transition-colors"
              >
                <Camera className="h-4 w-4 text-foreground" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{uploadingAvatar ? "Uploading..." : "Profile Photo"}</p>
              <p className="text-xs text-muted-foreground">Click the camera icon to change</p>
            </div>
          </div>

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
