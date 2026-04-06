import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function ChangePasswordSection({ showToast }) {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError(t("passwordTooShort")); return; }
    if (newPassword !== confirmPassword) { setError(t("passwordMismatch")); return; }
    setIsSaving(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      showToast(t("passwordUpdated"));
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") setError(t("wrongPassword"));
      else setError(err.message || t("passwordUpdateFailed"));
    } finally { setIsSaving(false); }
  };

  return (
    <section className="rounded-base border-2 border-border bg-secondary-background p-6 mb-6 shadow-shadow">
      <h2 className="font-heading text-lg font-black text-foreground mb-4">{t("changePassword")}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
          <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="newPassword">{t("newPassword")}</Label>
          <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
          <p className="text-xs text-muted-foreground">{t("passwordMinLength")}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmNewPassword">{t("confirmNewPassword")}</Label>
          <Input id="confirmNewPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
        </div>
        {error && <p className="text-sm text-destructive font-bold">{error}</p>}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? t("updatingPassword") : t("updatePassword")}
        </Button>
      </form>
    </section>
  );
}

export default ChangePasswordSection;
