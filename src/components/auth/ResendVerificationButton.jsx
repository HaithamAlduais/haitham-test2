import { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { auth, actionCodeSettings } from "../../firebase";
import { Button } from "@/components/ui/button";

const ResendVerificationButton = ({ user }) => {
  const [status, setStatus] = useState("idle");

  const handleResend = async () => {
    const target = user || auth.currentUser;
    if (!target) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    try {
      await sendEmailVerification(target, actionCodeSettings);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <p className="rounded-lg border border-main bg-main/10 p-3 text-center text-sm text-foreground">
        Verification email sent. Check your inbox.
      </p>
    );
  }

  return (
    <div>
      <Button
        onClick={handleResend}
        disabled={status === "sending"}
        className="w-full"
      >
        {status === "sending" ? "Sending..." : "Resend Verification Email"}
      </Button>
      {status === "error" && (
        <p className="mt-2 text-center text-sm text-destructive">
          Could not send verification email. Please try again later.
        </p>
      )}
    </div>
  );
};

export default ResendVerificationButton;
