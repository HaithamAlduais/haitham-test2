import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPost } from "@/utils/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Zap, Users, Shield, Eye, Mail, MessageSquare, Sparkles,
  LogIn, CheckCircle, XCircle, Clock, ExternalLink
} from "lucide-react";

const ADMIN_EMAIL = "alduaishaitham@gmail.com";

const TEST_ACCOUNTS = [
  { category: "Organizer", email: "organizer@test.ramsha.net", password: "Test@2026", name: "Sarah Al-Rashid", icon: "🏢", color: "bg-purple-500", dashPath: "/dashboard" },
  { category: "Participant", email: "lina@test.ramsha.net", password: "Test@2026", name: "Lina Khalid (Dev)", icon: "💻", color: "bg-blue-500", dashPath: "/home" },
  { category: "Participant", email: "omar@test.ramsha.net", password: "Test@2026", name: "Omar Farouk (Designer)", icon: "🎨", color: "bg-pink-500", dashPath: "/home" },
  { category: "Participant", email: "noura@test.ramsha.net", password: "Test@2026", name: "Noura Al-Saud (PM)", icon: "📋", color: "bg-green-500", dashPath: "/home" },
  { category: "Participant", email: "faisal@test.ramsha.net", password: "Test@2026", name: "Faisal Al-Harbi (ML)", icon: "🤖", color: "bg-amber-500", dashPath: "/home" },
  { category: "Participant", email: "dana@test.ramsha.net", password: "Test@2026", name: "Dana Mousa (Backend)", icon: "⚙️", color: "bg-cyan-500", dashPath: "/home" },
  { category: "Participant", email: "youssef@test.ramsha.net", password: "Test@2026", name: "Youssef Ibrahim (Frontend)", icon: "🌐", color: "bg-orange-500", dashPath: "/home" },
  { category: "Judge", email: "judge@test.ramsha.net", password: "Test@2026", name: "Dr. Ahmed Nasser", icon: "⚖️", color: "bg-yellow-500", dashPath: "/dashboard/judge/test-hackathon-2026" },
  { category: "Sponsor", email: "sponsor@test.ramsha.net", password: "Test@2026", name: "Reem Al-Faisal (STC)", icon: "💎", color: "bg-red-500", dashPath: "/sponsor/dashboard" },
];

const QUICK_LINKS = [
  { label: "Explore Page", path: "/explore", icon: "🔍" },
  { label: "Hackathon Page", path: "/hackathon/ai-builders-2026", icon: "🏆" },
  { label: "Register", path: "/event/test-hackathon-2026/register", icon: "📝" },
  { label: "Teams", path: "/event/test-hackathon-2026/teams", icon: "👥" },
  { label: "Submit", path: "/event/test-hackathon-2026/submit", icon: "📦" },
  { label: "Vote", path: "/event/test-hackathon-2026/vote", icon: "🗳️" },
  { label: "Gallery", path: "/event/test-hackathon-2026/gallery", icon: "🖼️" },
  { label: "Winners", path: "/event/test-hackathon-2026/winners", icon: "🎉" },
  { label: "Workshops", path: "/event/test-hackathon-2026/workshops", icon: "🎓" },
  { label: "Certificate", path: "/event/test-hackathon-2026/certificate", icon: "📜" },
  { label: "Office Hours", path: "/event/test-hackathon-2026/office-hours", icon: "🕐" },
  { label: "Legacy", path: "/event/test-hackathon-2026/legacy", icon: "🏛️" },
  { label: "Manage (Organizer)", path: "/hackathons/test-hackathon-2026", icon: "⚙️" },
  { label: "Analytics", path: "/hackathons/test-hackathon-2026/analytics", icon: "📊" },
  { label: "Page Builder", path: "/hackathons/test-hackathon-2026/page-builder", icon: "🎨" },
  { label: "Workback", path: "/hackathons/test-hackathon-2026/workback", icon: "📅" },
  { label: "Surveys", path: "/hackathons/test-hackathon-2026/surveys", icon: "📋" },
];

function StatusBadge({ status }) {
  const styles = {
    success: "bg-green-500/10 text-green-500 border-green-500/30",
    error: "bg-red-500/10 text-red-500 border-red-500/30",
    loading: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    idle: "bg-gray-500/10 text-gray-500 border-gray-500/30",
  };
  const icons = { success: CheckCircle, error: XCircle, loading: Clock, idle: Clock };
  const Icon = icons[status] || Clock;
  return (
    <span className={`inline-flex items-center gap-1 rounded-base border px-2 py-0.5 text-xs font-bold ${styles[status] || styles.idle}`}>
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
}

export default function AdminTestPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(null);
  const [emailTest, setEmailTest] = useState({ status: "idle", result: "" });
  const [discordTest, setDiscordTest] = useState({ status: "idle", result: "" });
  const [geminiTest, setGeminiTest] = useState({ status: "idle", result: "" });
  const [geminiPrompt, setGeminiPrompt] = useState("Evaluate this hackathon application: Student with Python and React skills, first hackathon, wants to build an AI chatbot.");

  // Gate: only admin can access
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <Shield className="h-16 w-16 text-main mx-auto" />
          <h1 className="text-2xl font-black text-foreground">Admin Test Panel</h1>
          <p className="text-muted-foreground">Login with admin credentials to access.</p>
          <Button onClick={() => navigate("/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <XCircle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-black text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">Only {ADMIN_EMAIL} can access this page.</p>
          <Button variant="neutral" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  // Switch to a test account
  const switchTo = async (account) => {
    setSwitching(account.email);
    try {
      await logout();
      await signInWithEmailAndPassword(auth, account.email, account.password);
      navigate(account.dashPath);
    } catch (err) {
      alert(`Login failed: ${err.message}`);
      setSwitching(null);
    }
  };

  // Test email
  const testEmail = async () => {
    setEmailTest({ status: "loading", result: "" });
    try {
      const result = await apiPost("/api/test-email", { to: ADMIN_EMAIL });
      setEmailTest({ status: "success", result: JSON.stringify(result, null, 2) });
    } catch (err) {
      setEmailTest({ status: "error", result: err.message });
    }
  };

  // Test Discord
  const testDiscord = async () => {
    setDiscordTest({ status: "loading", result: "" });
    try {
      const result = await apiGet("/api/hackathons/test-hackathon-2026/discord/status");
      setDiscordTest({ status: "success", result: JSON.stringify(result, null, 2) });
    } catch (err) {
      setDiscordTest({ status: "error", result: err.message });
    }
  };

  // Test Gemini
  const testGemini = async () => {
    setGeminiTest({ status: "loading", result: "" });
    try {
      const result = await apiPost("/api/test-gemini", { prompt: geminiPrompt });
      setGeminiTest({ status: "success", result: JSON.stringify(result, null, 2) });
    } catch (err) {
      setGeminiTest({ status: "error", result: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-2 border-border bg-secondary-background px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-base border-2 border-border bg-main shadow-neo-sm">
              <Shield className="h-5 w-5 text-main-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-black text-lg">Admin Test Panel</h1>
              <p className="text-xs text-muted-foreground">Test all platform features</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{currentUser.email}</span>
            <Button variant="neutral" size="sm" onClick={() => navigate("/")}>← Back</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* ── Switch User ── */}
        <section>
          <h2 className="text-xl font-black mb-1 flex items-center gap-2"><LogIn className="h-5 w-5 text-main" /> Switch to Test Account</h2>
          <p className="text-sm text-muted-foreground mb-4">Click any card to log in as that user and see their dashboard.</p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TEST_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => switchTo(acc)}
                disabled={switching === acc.email}
                className="text-left rounded-base border-2 border-border bg-card p-4 hover:border-main transition-colors disabled:opacity-50 space-y-2"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-base ${acc.color} text-white text-lg`}>
                    {acc.icon}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">{acc.category}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{acc.email}</p>
                {switching === acc.email && <p className="text-xs text-main font-bold">Switching...</p>}
              </button>
            ))}
          </div>
        </section>

        {/* ── Quick Links ── */}
        <section>
          <h2 className="text-xl font-black mb-1 flex items-center gap-2"><ExternalLink className="h-5 w-5 text-main" /> Quick Links</h2>
          <p className="text-sm text-muted-foreground mb-4">Jump to any page to test the UI. (Login as the right role first!)</p>

          <div className="flex flex-wrap gap-2">
            {QUICK_LINKS.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="flex items-center gap-1.5 rounded-base border-2 border-border bg-card px-3 py-2 text-xs font-bold hover:border-main transition-colors"
              >
                <span>{link.icon}</span> {link.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Integration Tests ── */}
        <section>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-main" /> Integration Tests</h2>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Email Test */}
            <div className="rounded-base border-2 border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-500" />
                <h3 className="font-bold text-foreground">Email (Resend)</h3>
                <StatusBadge status={emailTest.status} />
              </div>
              <p className="text-xs text-muted-foreground">Send a test email to {ADMIN_EMAIL}</p>
              <Button size="sm" onClick={testEmail} disabled={emailTest.status === "loading"}>
                {emailTest.status === "loading" ? "Sending..." : "Send Test Email"}
              </Button>
              {emailTest.result && (
                <pre className="text-xs bg-muted p-2 rounded-base overflow-auto max-h-32">{emailTest.result}</pre>
              )}
            </div>

            {/* Discord Test */}
            <div className="rounded-base border-2 border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold text-foreground">Discord Bot</h3>
                <StatusBadge status={discordTest.status} />
              </div>
              <p className="text-xs text-muted-foreground">Check Discord bot status for test hackathon</p>
              <Button size="sm" onClick={testDiscord} disabled={discordTest.status === "loading"}>
                {discordTest.status === "loading" ? "Checking..." : "Check Discord"}
              </Button>
              {discordTest.result && (
                <pre className="text-xs bg-muted p-2 rounded-base overflow-auto max-h-32">{discordTest.result}</pre>
              )}
            </div>

            {/* Gemini Test */}
            <div className="rounded-base border-2 border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-foreground">Gemini AI</h3>
                <StatusBadge status={geminiTest.status} />
              </div>
              <Textarea
                value={geminiPrompt}
                onChange={(e) => setGeminiPrompt(e.target.value)}
                rows={2}
                className="text-xs"
                placeholder="Test prompt..."
              />
              <Button size="sm" onClick={testGemini} disabled={geminiTest.status === "loading"}>
                {geminiTest.status === "loading" ? "Running AI..." : "Test Gemini"}
              </Button>
              {geminiTest.result && (
                <pre className="text-xs bg-muted p-2 rounded-base overflow-auto max-h-40">{geminiTest.result}</pre>
              )}
            </div>
          </div>
        </section>

        {/* ── Test Data Summary ── */}
        <section>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2"><Eye className="h-5 w-5 text-main" /> Test Data Summary</h2>
          <div className="rounded-base border-2 border-border bg-card p-4 font-mono text-xs space-y-1 text-muted-foreground">
            <p>Hackathon: <span className="text-foreground font-bold">Ramsha AI Builders Challenge 2026</span></p>
            <p>ID: test-hackathon-2026 | Slug: ai-builders-2026 | Status: active</p>
            <p>Tracks: AI Dev Tools, AI for Business, AI Creative Tools</p>
            <p>Prizes: $15,000+ (7 categories including sponsor & popular choice)</p>
            <p>Registrations: 6 (5 accepted, 1 pending) | Teams: 2 | Submissions: 2</p>
            <p>Team Alpha CodeForge (code: ALPHA1) — Lina, Omar, Noura — submitted "CodeReview AI"</p>
            <p>Team Beta NeuralNet (code: BETA22) — Faisal, Dana, Youssef — submitted "BizBot"</p>
            <p>Judge: Dr. Ahmed Nasser — scored both submissions</p>
            <p>Sponsor: STC (Reem Al-Faisal)</p>
            <p>3 workshops, 3 announcements, 4 votes, notifications seeded</p>
          </div>
        </section>
      </main>
    </div>
  );
}
