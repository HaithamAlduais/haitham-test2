import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { apiPost } from "../../utils/apiClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function DeleteAccountSection({ showToast }) {
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isPasswordProvider = currentUser?.providerData?.[0]?.providerId === "password";

  const handleDelete = async () => {
    setError("");
    if (confirmText !== "DELETE") { setError(t("deleteConfirmRequired")); return; }
    setIsDeleting(true);
    try {
      if (isPasswordProvider) {
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
      }
      await apiPost("/api/users/delete-account", { confirmation: "DELETE" });
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") setError(t("passwordIncorrect"));
      else setError(err.message || t("deleteAccountFailed"));
    } finally { setIsDeleting(false); }
  };

  const resetForm = () => { setConfirmText(""); setPassword(""); setError(""); };

  return (
    <section className="rounded-base border-2 border-destructive/30 bg-secondary-background p-6 mb-6 shadow-shadow">
      <h2 className="font-heading text-lg font-black text-destructive mb-2">{t("deleteAccount")}</h2>
      <p className="text-sm text-muted-foreground mb-4">{t("deleteAccountWarning")}</p>

      <AlertDialog onOpenChange={(open) => { if (!open) resetForm(); }}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">{t("deleteAccount")}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteAccount")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteAccountConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            {isPasswordProvider && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="delete-password">{t("enterYourPassword")}</Label>
                <Input id="delete-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="delete-confirm">{t("typeDeleteToConfirm")}</Label>
              <Input id="delete-confirm" type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
            </div>
            {error && <p className="text-sm text-destructive font-bold">{error}</p>}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={isDeleting || confirmText !== "DELETE"}
              className="border-destructive bg-destructive/10 text-destructive hover:bg-destructive hover:text-background"
            >
              {isDeleting ? t("deleting") : t("permanentlyDeleteAccount")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default DeleteAccountSection;
