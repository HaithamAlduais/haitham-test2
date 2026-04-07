import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Mail, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RetroGrid } from "@/components/ui/retro-grid";
import { useLanguage } from "@/context/LanguageContext";
import ResendVerificationButton from "../components/auth/ResendVerificationButton";

const VerifyEmailHoldingPage = () => {
  const navigate = useNavigate();
  const { dir } = useLanguage();

  const checkVerification = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    await user.reload();

    if (user.emailVerified) {
      try {
        const userDocSnap = await getDoc(doc(db, "users", user.uid));
        const role = userDocSnap.exists() ? userDocSnap.data().role : null;
        navigate(role === "Organizer" || role === "Provider" ? "/dashboard" : "/home", { replace: true });
      } catch {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [navigate]);

  useEffect(() => {
    checkVerification();
    const interval = setInterval(checkVerification, 5000);
    return () => clearInterval(interval);
  }, [checkVerification]);

  return (
    <RetroGrid
      className="bg-background"
      lineColor="var(--border)"
      opacity={0.4}
      cellSize={60}
      angle={65}
    >
      <div className="flex min-h-screen w-full items-center justify-center p-4" dir={dir}>
        <div className="relative z-10 w-full max-w-md rounded-2xl border-2 border-border bg-secondary-background p-8 text-center shadow-shadow sm:p-10">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center gap-2">
            <img src="/ramsha-logo-black.png" alt="Ramsha" className="h-16 w-16 object-contain dark:invert" />
            <span className="text-lg font-black tracking-tight text-foreground">ramsha</span>
          </div>

          {/* Mail icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-panel-blue shadow-neo-sm">
            <Mail className="h-7 w-7 text-main" strokeWidth={2} />
          </div>

          <h2 className="text-2xl font-black text-foreground">Verify Your Email</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            We sent a verification link to{" "}
            <strong>{auth.currentUser?.email}</strong>.
            <br />
            Click the link in that email to activate your account.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            This page will automatically update once your email is verified.
          </p>

          <div className="mt-6">
            <ResendVerificationButton />
          </div>

          <Button
            variant="neutral"
            className="mt-3 w-full"
            onClick={() => {
              auth.signOut();
              navigate("/login", { replace: true });
            }}
          >
            Back to Login
          </Button>
        </div>
      </div>
    </RetroGrid>
  );
};

export default VerifyEmailHoldingPage;
