import { useEffect, useState } from "react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

// Ramsha — ResetPasswordPage
// Handles the oobCode from the Firebase password reset email link.
// Verifies the code is still valid, then lets the user set a new password
// by calling confirmPasswordReset with the oobCode and new password.
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | form | submitting | success | invalid
  const [oobCode, setOobCode] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("oobCode");
    if (!code) {
      setStatus("invalid");
      return;
    }
    // Confirm the code is valid and not expired before showing the form
    verifyPasswordResetCode(auth, code)
      .then(() => {
        setOobCode(code);
        setStatus("form");
      })
      .catch(() => setStatus("invalid"));
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setStatus("submitting");
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus("success");
    } catch (err) {
      setStatus("form");
      if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.");
      } else if (err.code === "auth/expired-action-code") {
        setError("This reset link has expired. Please request a new one.");
      } else {
        setError("Failed to reset password. Please try again.");
      }
    }
  };

  return (
    <div style={styles.page}>
      {/* Left — Branding Panel */}
      <div style={styles.brandPanel}>
        <div style={styles.brandContent}>
          <div style={styles.logo}>R</div>
          <h1 style={styles.brandTitle}>Ramsha</h1>
          <p style={styles.brandTagline}>
            Connecting Organizers and Participants in one secure platform.
          </p>
        </div>
      </div>

      {/* Right — Status Panel */}
      <div style={styles.formPanel}>
        <div style={styles.formContent}>
          {status === "verifying" && (
            <>
              <div style={styles.iconWrap}>...</div>
              <h2 style={styles.title}>Checking reset link...</h2>
              <p style={styles.text}>Please wait a moment.</p>
            </>
          )}

          {(status === "form" || status === "submitting") && (
            <>
              <h2 style={styles.title}>Set New Password</h2>
              <p style={styles.text}>
                Enter a new password for your account.
              </p>

              {error && <p style={styles.error}>{error}</p>}

              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.field}>
                  <label style={styles.label}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    required
                    style={styles.input}
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  style={{
                    ...styles.button,
                    opacity: status === "submitting" ? 0.7 : 1,
                    cursor: status === "submitting" ? "not-allowed" : "pointer",
                  }}
                >
                  {status === "submitting" ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {status === "success" && (
            <>
              <div style={styles.iconWrap}>&#10003;</div>
              <h2 style={styles.title}>Password Reset</h2>
              <p style={styles.text}>
                Your password has been updated. You can now log in with your new
                password.
              </p>
              <button
                onClick={() => navigate("/login")}
                style={styles.button}
              >
                Go to Login
              </button>
            </>
          )}

          {status === "invalid" && (
            <>
              <div style={styles.iconWrap}>!</div>
              <h2 style={styles.title}>Link Invalid or Expired</h2>
              <p style={styles.text}>
                This password reset link is invalid or has expired. Please
                request a new one from the login page.
              </p>
              <button
                onClick={() => navigate("/login")}
                style={styles.secondaryButton}
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { display: "flex", flexWrap: "wrap", minHeight: "100vh", width: "100%" },
  brandPanel: {
    flex: "0 0 58%",
    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem",
    minWidth: "320px",
  },
  brandContent: { maxWidth: "520px" },
  logo: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    backgroundColor: "rgba(255,255,255,0.15)",
    color: "#fff",
    fontSize: "2rem",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "2rem",
  },
  brandTitle: {
    fontSize: "3.5rem",
    fontWeight: "800",
    color: "#fff",
    marginBottom: "1rem",
    letterSpacing: "-1px",
  },
  brandTagline: {
    fontSize: "1.15rem",
    color: "rgba(255,255,255,0.75)",
    lineHeight: "1.8",
  },
  formPanel: {
    flex: "1 1 42%",
    minWidth: "320px",
    backgroundColor: "var(--secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  formContent: { width: "100%", maxWidth: "400px" },
  iconWrap: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "var(--card)",
    color: "#4f46e5",
    fontSize: "1.8rem",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.5rem",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "var(--foreground)",
    marginBottom: "0.6rem",
    textAlign: "center",
  },
  text: {
    color: "var(--muted-foreground)",
    fontSize: "0.95rem",
    lineHeight: "1.6",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  error: {
    color: "#dc2626",
    fontSize: "0.875rem",
    marginBottom: "1rem",
    padding: "0.75rem",
    backgroundColor: "#fef2f2",
    borderRadius: "8px",
    border: "1px solid #fecaca",
  },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "var(--foreground)",
  },
  input: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1.5px solid var(--border)",
    fontSize: "1rem",
    backgroundColor: "var(--secondary)",
    color: "var(--foreground)",
    outline: "none",
  },
  button: {
    display: "block",
    width: "100%",
    padding: "0.85rem",
    backgroundColor: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "0.5rem",
    textAlign: "center",
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.35rem",
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "var(--card)",
    color: "#4f46e5",
    border: "2px solid var(--border)",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "0.75rem",
  },
};

export default ResetPasswordPage;
