import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, actionCodeSettings, passwordResetActionCodeSettings } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RetroGrid } from "@/components/ui/retro-grid";
import { useLanguage } from "@/context/LanguageContext";

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const skipEmailVerification =
  import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === "true";

const Login = () => {
  const location = useLocation();
  const initialMode = location.pathname === "/signup" ? "signup" : "login";
  const [mode, setMode] = useState(initialMode);
  const [flipping, setFlipping] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "Participant",
  });
  const [error, setError] = useState("");
  const [pendingOAuthUser, setPendingOAuthUser] = useState(null); // For role selection after OAuth
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();
  const { t, dir } = useLanguage();

  const flipTo = (target) => {
    setFlipping(true);
    setError("");
    setTimeout(() => {
      setMode(target);
      setShowResetForm(false);
      window.history.replaceState(null, "", target === "signup" ? "/signup" : "/login");
    }, 300);
    setTimeout(() => setFlipping(false), 600);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      if (!user.emailVerified && !skipEmailVerification) {
        await sendEmailVerification(user, actionCodeSettings);
        navigate("/verify-email", { replace: true });
        return;
      }
      const userDocSnap = await getDoc(doc(db, "users", user.uid));
      const role = userDocSnap.exists() ? userDocSnap.data().role : null;
      navigate(role === "Organizer" || role === "Provider" ? "/dashboard" : "/home", { replace: true });
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (signupData.password !== signupData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (signupData.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        role: signupData.role,
        roles: [signupData.role],
        createdAt: serverTimestamp(),
      });
      await sendEmailVerification(user, actionCodeSettings);
      navigate("/verify-email", { replace: true });
    } catch (err) {
      setError(getSignupErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail, passwordResetActionCodeSettings);
      setResetSuccess(true);
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoOrganizerLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const demoEmail = import.meta.env.VITE_DEMO_PROVIDER_EMAIL;
      const demoPassword = import.meta.env.VITE_DEMO_PROVIDER_PASSWORD;
      if (!demoEmail || !demoPassword) {
        setError("Demo organizer not available. Set VITE_DEMO_PROVIDER_EMAIL and VITE_DEMO_PROVIDER_PASSWORD in your .env file.");
        setLoading(false);
        return;
      }
      const cred = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      const demoDocRef = doc(db, "users", cred.user.uid);
      const demoSnap = await getDoc(demoDocRef);
      if (!demoSnap.exists()) {
        await setDoc(demoDocRef, {
          uid: cred.user.uid,
          email: cred.user.email,
          role: "Organizer",
          roles: ["Organizer"],
          createdAt: serverTimestamp(),
        });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  // Shared OAuth handler — checks if user exists, asks role if new
  const handleOAuthResult = async (user) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      // Existing user — go to dashboard
      const role = userDocSnap.data().role;
      navigate(role === "Organizer" || role === "Provider" ? "/dashboard" : "/home", { replace: true });
    } else {
      // New user — ask for role
      setPendingOAuthUser(user);
    }
  };

  const completeOAuthSignup = async (selectedRole) => {
    if (!pendingOAuthUser) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "users", pendingOAuthUser.uid), {
        uid: pendingOAuthUser.uid,
        email: pendingOAuthUser.email,
        displayName: pendingOAuthUser.displayName || "",
        role: selectedRole,
        roles: [selectedRole],
        createdAt: serverTimestamp(),
      });
      setPendingOAuthUser(null);
      navigate(selectedRole === "Organizer" ? "/dashboard" : "/home", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleOAuthResult(result.user);
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, githubProvider);
      await handleOAuthResult(result.user);
    } catch (err) {
      if (err.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with the same email. Try signing in with Google or email.");
      } else {
        setError(getFirebaseErrorMessage(err.code));
      }
    } finally {
      setLoading(false);
    }
  };

  // Role selection modal for new OAuth users
  if (pendingOAuthUser) {
    return (
      <RetroGrid className="bg-background" lineColor="var(--border)" opacity={0.4} cellSize={60} angle={65}>
        <div className="flex min-h-screen items-center justify-center px-4" dir={dir}>
          <div className="w-full max-w-md rounded-2xl border-2 border-border bg-secondary-background p-8 shadow-shadow">
            <div className="mb-6 flex items-center gap-2">
              <img src="/ramsha-logo-black.jpg" alt="Ramsha" className="h-9 w-9 object-contain dark:invert" />
              <span className="text-lg font-black tracking-tight text-foreground">ramsha</span>
            </div>

            <h2 className="text-2xl font-black text-foreground">{t("auth.chooseRole") || "Choose Your Role"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("auth.chooseRoleDesc") || `Welcome ${pendingOAuthUser.displayName || pendingOAuthUser.email}! How will you use Ramsha?`}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => completeOAuthSignup("Participant")}
                disabled={loading}
                className="flex items-center gap-4 rounded-base border-2 border-border bg-card p-4 text-start hover:border-main transition-colors"
              >
                <span className="text-3xl">🎯</span>
                <div>
                  <p className="font-bold text-foreground">{t("auth.participant") || "Participant"}</p>
                  <p className="text-xs text-muted-foreground">{t("auth.participantDesc") || "Join hackathons, form teams, submit projects"}</p>
                </div>
              </button>

              <button
                onClick={() => completeOAuthSignup("Organizer")}
                disabled={loading}
                className="flex items-center gap-4 rounded-base border-2 border-border bg-card p-4 text-start hover:border-main transition-colors"
              >
                <span className="text-3xl">🏢</span>
                <div>
                  <p className="font-bold text-foreground">{t("auth.organizer") || "Organizer"}</p>
                  <p className="text-xs text-muted-foreground">{t("auth.organizerDesc") || "Create and manage hackathons, review teams"}</p>
                </div>
              </button>
            </div>

            {loading && <p className="mt-4 text-center text-sm text-main font-bold">{t("auth.settingUp") || "Setting up your account..."}</p>}
          </div>
        </div>
      </RetroGrid>
    );
  }

  return (
    <RetroGrid
      className="bg-background"
      lineColor="var(--border)"
      opacity={0.4}
      cellSize={60}
      angle={65}
    >
      <div className="flex min-h-screen w-full items-center justify-center p-4" dir={dir}>
        {/* Card flip container */}
        <div
          className="relative w-full max-w-md"
          style={{ perspective: "1200px" }}
        >
          <div
            className="relative w-full transition-transform duration-600 ease-in-out"
            style={{
              transformStyle: "preserve-3d",
              transform: mode === "signup" ? "rotateY(180deg)" : "rotateY(0deg)",
              transition: "transform 0.6s ease-in-out",
            }}
          >
            {/* ── LOGIN FACE (front) ── */}
            <div
              className="w-full rounded-2xl border-2 border-border bg-secondary-background p-8 shadow-shadow sm:p-10"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="mb-8 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-border bg-main shadow-neo-sm">
                  <Zap className="h-4 w-4 text-main-foreground" strokeWidth={3} />
                </div>
                <span className="text-lg font-black tracking-tight text-foreground">ramsha</span>
              </div>

              {showResetForm ? (
                <>
                  <h2 className="text-2xl font-black text-foreground">{t("auth.resetPassword")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("auth.resetPasswordDesc")}</p>
                  {error && <ErrorBanner message={error} />}
                  {resetSuccess ? (
                    <div className="mt-6 rounded-lg border border-main bg-main/10 p-4 text-foreground">
                      <p className="font-bold">{t("auth.checkEmail")}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{t("auth.resetLinkSent")} <strong>{resetEmail}</strong>.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleResetPassword} className="mt-6 flex flex-col gap-5">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="reset-email">{t("auth.emailLabel")}</Label>
                        <Input id="reset-email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required placeholder={t("auth.emailPlaceholder")} />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? t("auth.sending") : t("auth.sendResetLink")}
                      </Button>
                    </form>
                  )}
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    <button onClick={() => { setShowResetForm(false); setResetSuccess(false); setResetEmail(""); setError(""); }} className="font-bold text-main hover:underline">
                      {t("auth.backToLogin")}
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-black text-foreground">{t("auth.login")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("auth.continueToRamsha")}</p>
                  {error && <ErrorBanner message={error} />}
                  <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="login-email">{t("auth.emailLabel")}</Label>
                      <Input id="login-email" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder={t("auth.emailPlaceholder")} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">{t("auth.passwordLabel")}</Label>
                        <button type="button" onClick={() => { setShowResetForm(true); setError(""); }} className="text-xs font-bold text-main hover:underline">{t("auth.forgotPassword")}</button>
                      </div>
                      <Input id="login-password" type="password" name="password" value={formData.password} onChange={handleChange} required placeholder={t("auth.passwordPlaceholder")} />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? t("auth.signingIn") : t("auth.continueWithEmail")}
                    </Button>
                  </form>

                  <div className="my-6 flex items-center gap-3">
                    <div className="h-[1px] flex-1 bg-border" />
                    <span className="text-xs font-medium uppercase text-muted-foreground">{t("auth.or")}</span>
                    <div className="h-[1px] flex-1 bg-border" />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleGoogleSignIn} disabled={loading} variant="neutral" className="flex-1">
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                    </Button>
                    <Button onClick={handleGithubSignIn} disabled={loading} variant="neutral" className="flex-1">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                    </Button>
                    <Button type="button" onClick={handleDemoOrganizerLogin} disabled={loading} variant="neutral" className="flex-1 text-xs">
                      {t("auth.demoOrganizer")}
                    </Button>
                  </div>

                  <p className="mt-8 text-center text-sm text-muted-foreground">
                    {t("auth.newToRamsha")}{" "}
                    <button onClick={() => flipTo("signup")} className="font-bold text-main hover:underline">
                      {t("auth.getStarted")} →
                    </button>
                  </p>

                  <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <a href="#" className="hover:text-foreground">{t("auth.help")}</a>
                    <a href="#" className="hover:text-foreground">{t("auth.privacy")}</a>
                    <a href="#" className="hover:text-foreground">{t("auth.terms")}</a>
                  </div>
                </>
              )}
            </div>

            {/* ── SIGNUP FACE (back) ── */}
            <div
              className="absolute inset-0 w-full rounded-2xl border-2 border-border bg-secondary-background p-8 shadow-shadow sm:p-10"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="mb-8 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-border bg-main shadow-neo-sm">
                  <Zap className="h-4 w-4 text-main-foreground" strokeWidth={3} />
                </div>
                <span className="text-lg font-black tracking-tight text-foreground">ramsha</span>
              </div>

              <h2 className="text-2xl font-black text-foreground">{t("auth.signup")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("auth.continueToRamsha")}</p>
              {error && mode === "signup" && <ErrorBanner message={error} />}

              <form onSubmit={handleSignup} className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signup-email">{t("auth.emailLabel")}</Label>
                  <Input id="signup-email" type="email" name="email" value={signupData.email} onChange={handleSignupChange} required placeholder={t("auth.emailPlaceholder")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signup-password">{t("auth.passwordLabel")}</Label>
                  <Input id="signup-password" type="password" name="password" value={signupData.password} onChange={handleSignupChange} required placeholder="Min. 6 characters" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input id="signup-confirm" type="password" name="confirmPassword" value={signupData.confirmPassword} onChange={handleSignupChange} required placeholder="Repeat your password" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="signup-role">I am a...</Label>
                  <select
                    id="signup-role"
                    name="role"
                    value={signupData.role}
                    onChange={handleSignupChange}
                    className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2"
                  >
                    <option value="Participant">Participant</option>
                    <option value="Organizer">Organizer</option>
                  </select>
                </div>
                <Button type="submit" disabled={loading} className="w-full mt-1">
                  {loading ? "Creating Account..." : t("auth.signup")}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button onClick={() => flipTo("login")} className="font-bold text-main hover:underline">
                  {t("auth.login")}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </RetroGrid>
  );
};

function ErrorBanner({ message }) {
  return (
    <div className="mt-4 rounded-lg border border-destructive bg-destructive-50 p-3 text-sm text-destructive">
      {message}
    </div>
  );
}

const getFirebaseErrorMessage = (code) => {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    default:
      return "Something went wrong. Please try again.";
  }
};

const getSignupErrorMessage = (code) => {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    default:
      return "Something went wrong. Please try again.";
  }
};

export default Login;
