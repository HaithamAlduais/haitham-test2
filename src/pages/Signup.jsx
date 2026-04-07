import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, actionCodeSettings } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "Participant",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        role: formData.role,
        roles: [formData.role],
        createdAt: serverTimestamp(),
      });

      await sendEmailVerification(user, actionCodeSettings);
      navigate("/verify-email", { replace: true });
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-[58%] bg-panel-blue items-center justify-center p-16">
        <div className="max-w-lg">
          <div className="w-16 h-16 rounded-xl border-2 border-border bg-background flex items-center justify-center mb-8 shadow-shadow">
            <Zap className="w-8 h-8 text-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl font-black text-foreground mb-4 tracking-tight">
            Ramsha
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Create your account and choose your role to get started.
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <span className="text-main">✓</span> Organizer — manage and create hackathons
            </div>
            <div className="flex items-center gap-2 text-foreground font-medium">
              <span className="text-main">✓</span> Participant — discover and enroll
            </div>
            <div className="flex items-center gap-2 text-foreground font-medium">
              <span className="text-main">✓</span> Verified with secure email confirmation
            </div>
          </div>
        </div>
      </div>

      {/* Right — Form Panel */}
      <div className="w-full lg:w-[42%] min-w-[320px] bg-secondary-background flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-black text-foreground mb-1">Create Account</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Fill in your details to get started
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg border border-destructive bg-destructive-50 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Min. 6 characters"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Repeat your password"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="role">I am a...</Label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2"
              >
                <option value="Participant">Participant</option>
                <option value="Organizer">Organizer</option>
              </select>
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-main font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const getFirebaseErrorMessage = (code) => {
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

export default Signup;
