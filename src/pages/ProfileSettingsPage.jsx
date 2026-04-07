import { useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import ProfileInfoSection from "../components/settings/ProfileInfoSection";
import ChangePasswordSection from "../components/settings/ChangePasswordSection";
import DeleteAccountSection from "../components/settings/DeleteAccountSection";
import ExtendedProfileSection from "../components/settings/ExtendedProfileSection";
import ProfileVisibilitySection from "../components/settings/ProfileVisibilitySection";
import BadgeGrid from "../components/profile/BadgeGrid";
import { DashboardLayout } from "../components/layout/DashboardLayout";

const ProfileSettingsPage = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const isPasswordProvider =
    currentUser?.providerData?.[0]?.providerId === "password";

  return (
    <DashboardLayout activePath="/settings">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-3xl font-black text-foreground mb-8">
          {t("settings")}
        </h1>

        <ProfileInfoSection showToast={showToast} />

        <BadgeGrid />

        <ExtendedProfileSection showToast={showToast} />

        <ProfileVisibilitySection showToast={showToast} />

        {isPasswordProvider && <ChangePasswordSection showToast={showToast} />}

        <DeleteAccountSection showToast={showToast} />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 end-6 z-[60] rounded-base border-2 px-5 py-3 text-sm font-bold shadow-shadow ${
          toast.type === "error" ? "border-destructive bg-background text-destructive" : "border-main bg-background text-foreground"
        }`}>
          {toast.message}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProfileSettingsPage;
