import { useEffect, useState } from "react";
import { applyActionCode } from "firebase/auth";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import ResendVerificationButton from "../components/auth/ResendVerificationButton";

// Ramsha — EmailVerifiedPage
// Handles the oobCode from the Firebase verification email link.
// Applies the action code to verify the user's email and shows
// success, loading, or error states accordingly.
const EmailVerifiedPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");

    if (!oobCode) {
      setStatus("error");
      return;
    }

    applyActionCode(auth, oobCode)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [searchParams]);

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
          {status === "loading" && (
            <>
              <div style={styles.iconWrap}>...</div>
              <h2 style={styles.title}>Verifying your email...</h2>
              <p style={styles.text}>
                Please wait while we confirm your email address.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div style={styles.iconWrap}>&#10003;</div>
              <h2 style={styles.title}>Email Verified</h2>
              <p style={styles.text}>
                Your email has been verified. You can now log in.
              </p>
              <button
                onClick={() => navigate("/login")}
                style={styles.button}
              >
                Go to Login
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div style={styles.iconWrap}>!</div>
              <h2 style={styles.title}>Verification Failed</h2>
              <p style={styles.text}>
                This verification link is invalid or has expired.
              </p>
              <div style={{ marginTop: "1.5rem" }}>
                <ResendVerificationButton />
              </div>
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
    marginBottom: "2rem",
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
  formContent: { width: "100%", maxWidth: "400px", textAlign: "center" },
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
  },
  text: {
    color: "var(--muted-foreground)",
    fontSize: "0.95rem",
    lineHeight: "1.6",
    marginBottom: "1.5rem",
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
    textDecoration: "none",
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

export default EmailVerifiedPage;
