import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/utils/apiClient";
import { useLanguage } from "@/context/LanguageContext";
import { auth } from "@/firebase";
import {
  Upload,
  Sparkles,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Monitor,
  MapPin,
  Plus,
  Trash2,
  Trophy,
  Award,
  Star,
  Users,
  Heart,
  Building2,
  Code,
  Eye,
  Send,
  FileText,
  Download,
  X,
  Save,
} from "lucide-react";

// ── Initial form data ────────────────────────────────────────────────────────
const INITIAL_DATA = {
  title: "",
  description: "",
  rules: "",
  format: "online",
  location: { name: "", address: "", lat: null, lng: null },
  targetAudience: "",
  contactEmail: "",
  schedule: {
    registrationOpen: "",
    registrationClose: "",
    judgingStart: "",
    judgingEnd: "",
  },
  hackathonStart: "",
  hackathonEnd: "",
  sessionsStart: "",
  sessionsEnd: "",
  judgingMode: "during", // "during" | "custom"
  tracks: [],
  judgingCriteria: [],
  prizes: [],
  settings: { maxRegistrants: 500, teamSizeMin: 2, teamSizeMax: 5, allowSolo: false },
  branding: { logoUrl: "", bannerUrl: "", primaryColor: "#7C3AED", secondaryColor: "#00D4AA", hashtag: "" },
  sponsors: [],
  faq: [],
  isPublic: true,
};

// ── Prize helpers ────────────────────────────────────────────────────────────
const EMPTY_PRIZE = {
  place: "",
  title: "",
  description: "",
  value: "",
  category: "overall",
  type: "cash",
  trackId: "",
  sponsorName: "",
};

const EMPTY_SPONSOR = {
  name: "",
  tier: "gold",
  logoUrl: "",
  websiteUrl: "",
  description: "",
};

const TIERS = ["platinum", "gold", "silver", "bronze", "partner"];
const TIER_COLORS = {
  platinum: "bg-slate-100 text-slate-800",
  gold: "bg-yellow-100 text-yellow-800",
  silver: "bg-gray-100 text-gray-700",
  bronze: "bg-orange-100 text-orange-800",
  partner: "bg-blue-100 text-blue-800",
};

// ── Collapsible section ──────────────────────────────────────────────────────
function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-base border-2 border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-start hover:bg-muted/50 transition-colors"
      >
        <h3 className="text-lg font-black text-foreground">{title}</h3>
        {open ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-5 border-t-2 border-border pt-5">{children}</div>}
    </div>
  );
}

// ── AI Landing Page Generator overlay ────────────────────────────────────────
function AIPageGenerator({ data, hackathonId, hackathonSlug, onClose }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [pageHtml, setPageHtml] = useState("");
  const [generating, setGenerating] = useState(false);
  const [chatPrompt, setChatPrompt] = useState("");
  const [improving, setImproving] = useState(false);
  const [activeView, setActiveView] = useState("preview");
  const [genError, setGenError] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const result = await apiPost("/api/ai/generate-landing-page", { wizardData: data });
      if (result.html) setPageHtml(result.html);
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleImprove = async () => {
    if (!chatPrompt.trim() || !pageHtml) return;
    setImproving(true);
    setGenError(null);
    try {
      const result = await apiPost("/api/ai/improve-landing-page", {
        currentHtml: pageHtml,
        instruction: chatPrompt,
        wizardData: data,
      });
      if (result.html) {
        setPageHtml(result.html);
        setChatPrompt("");
      }
    } catch (err) {
      setGenError(err.message);
    } finally {
      setImproving(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPageHtml(ev.target.result);
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const blob = new Blob([pageHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(data.title || "hackathon").toLowerCase().replace(/\s+/g, "-")}-page.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDone = async () => {
    // Save the custom page HTML back to the hackathon if it exists
    if (pageHtml && hackathonId) {
      try {
        await apiPost(`/api/hackathons/${hackathonId}/page`, {
          customPageHtml: pageHtml,
          hasCustomPage: true,
        });
      } catch {
        // Non-critical — navigate anyway
      }
    }
    navigate(`/hackathons/${hackathonSlug || hackathonId}`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center justify-between px-6 md:px-12 shrink-0">
        <h1 className="font-heading font-black text-lg text-foreground">
          {t("landingPageTitle") || "\u0635\u0641\u062d\u0629 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646"}
        </h1>
        <div className="flex items-center gap-3">
          {pageHtml && (
            <>
              <Button variant="neutral" size="sm" onClick={() => setActiveView(activeView === "preview" ? "code" : "preview")}>
                {activeView === "preview" ? (
                  <><Code className="h-3.5 w-3.5" /> {t("codeEditor") || "\u0627\u0644\u0643\u0648\u062f"}</>
                ) : (
                  <><Eye className="h-3.5 w-3.5" /> {t("preview") || "\u0645\u0639\u0627\u064a\u0646\u0629"}</>
                )}
              </Button>
              <Button variant="neutral" size="sm" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" /> {t("downloadHtml") || "\u062a\u062d\u0645\u064a\u0644"}
              </Button>
            </>
          )}
          <Button onClick={handleDone} size="sm">
            {t("doneBtn") || "\u062a\u0645"}
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Generate button — when no HTML yet */}
          {!pageHtml && (
            <div className="text-center py-16 rounded-base border-2 border-dashed border-border space-y-4">
              <Sparkles className="h-12 w-12 text-main mx-auto" />
              <p className="text-muted-foreground">
                {t("generatePageDesc") || "\u0627\u0636\u063a\u0637 \u0644\u0625\u0646\u0634\u0627\u0621 \u0635\u0641\u062d\u0629 \u0647\u0627\u0643\u0627\u062b\u0648\u0646 \u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a"}
              </p>
              <div className="flex flex-col items-center gap-3">
                <Button size="lg" onClick={handleGenerate} disabled={generating} className="gap-2">
                  <Sparkles className="h-5 w-5" />
                  {generating
                    ? (t("generatingPage") || "\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0646\u0634\u0627\u0621...")
                    : (t("generatePage") || "\u2728 \u0623\u0646\u0634\u0626 \u0635\u0641\u062d\u0629 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646")}
                </Button>
                <label className="cursor-pointer text-sm text-muted-foreground hover:text-main transition-colors">
                  <input type="file" accept=".html,.htm" onChange={handleFileUpload} className="hidden" />
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {t("uploadHtml") || "\u0623\u0648 \u0627\u0631\u0641\u0639 \u0645\u0644\u0641 HTML"}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Preview */}
          {pageHtml && activeView === "preview" && (
            <div className="rounded-base border-2 border-border overflow-hidden">
              <iframe srcDoc={pageHtml} className="w-full h-[600px] bg-white" title="Preview" sandbox="allow-scripts" />
            </div>
          )}

          {/* Code editor */}
          {pageHtml && activeView === "code" && (
            <textarea
              value={pageHtml}
              onChange={(e) => setPageHtml(e.target.value)}
              className="w-full h-[500px] rounded-base border-2 border-border bg-background p-4 font-mono text-xs resize-none"
              dir="ltr"
              spellCheck={false}
            />
          )}

          {/* Chat to improve */}
          {pageHtml && (
            <div className="flex gap-2">
              <Textarea
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                placeholder={t("improvePlaceholder") || "\u0627\u0643\u062a\u0628 \u062a\u0639\u062f\u064a\u0644\u0627\u062a\u0643... \u0645\u062b\u0627\u0644: \u063a\u064a\u0651\u0631 \u0627\u0644\u0623\u0644\u0648\u0627\u0646\u060c \u0623\u0636\u0641 \u0642\u0633\u0645 \u0627\u0644\u0631\u0639\u0627\u0629\u060c \u0627\u062c\u0639\u0644 \u0627\u0644\u062e\u0637 \u0623\u0643\u0628\u0631"}
                rows={2}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleImprove();
                  }
                }}
              />
              <Button onClick={handleImprove} disabled={improving || !chatPrompt.trim()} className="shrink-0 self-end">
                <Send className="h-4 w-4" />
                {improving ? "..." : (t("improveBtn") || "\u0639\u062f\u0651\u0644")}
              </Button>
            </div>
          )}

          {/* Regenerate */}
          {pageHtml && (
            <Button variant="neutral" size="sm" onClick={handleGenerate} disabled={generating}>
              <Sparkles className="h-4 w-4" /> {generating ? "..." : (t("regenerate") || "\u0625\u0639\u0627\u062f\u0629 \u0625\u0646\u0634\u0627\u0621")}
            </Button>
          )}

          {genError && (
            <div className="rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{genError}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN WIZARD COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function HackathonCreationWizard({ onClose }) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // ── Pre-step: file upload ──────────────────────────────────────────────────
  const [showUpload, setShowUpload] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // ── Form data ──────────────────────────────────────────────────────────────
  const [data, setData] = useState(INITIAL_DATA);
  const updateData = (partial) => setData((prev) => ({ ...prev, ...partial }));

  // ── Submission state ───────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ── AI page generator overlay ──────────────────────────────────────────────
  const [showPageGen, setShowPageGen] = useState(false);
  const [savedHackathon, setSavedHackathon] = useState(null); // { id, slug }

  // ── Inline add-form state ──────────────────────────────────────────────────
  const [newTrack, setNewTrack] = useState({ name: "", description: "" });
  const [newPrize, setNewPrize] = useState({ ...EMPTY_PRIZE });
  const [newSponsor, setNewSponsor] = useState({ ...EMPTY_SPONSOR });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const schedule = data.schedule || {};
  const updateSchedule = (key, value) => updateData({ schedule: { ...schedule, [key]: value } });
  const location = data.location || { name: "", address: "" };
  const updateLocation = (field, value) => updateData({ location: { ...location, [field]: value } });

  const tracks = data.tracks || [];
  const prizes = data.prizes || [];
  const sponsors = data.sponsors || [];

  // Prize categories & types
  const CATEGORIES = [
    { value: "overall", label: t("catOverall") || "\u0639\u0627\u0645", icon: Trophy, color: "text-yellow-500" },
    { value: "per_track", label: t("catPerTrack") || "\u0644\u0643\u0644 \u0645\u0633\u0627\u0631", icon: Award, color: "text-blue-500" },
    { value: "special", label: t("catSpecial") || "\u062e\u0627\u0635", icon: Star, color: "text-purple-500" },
    { value: "sponsor", label: t("catSponsor") || "\u0631\u0627\u0639\u064a", icon: Users, color: "text-green-500" },
    { value: "popular_choice", label: t("catPopularChoice") || "\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u062c\u0645\u0647\u0648\u0631", icon: Heart, color: "text-red-500" },
  ];

  const TYPES = [
    { value: "cash", label: t("typeCash") || "\u0646\u0642\u062f\u064a" },
    { value: "credits", label: t("typeCredits") || "\u0631\u0635\u064a\u062f" },
    { value: "access", label: t("typeAccess") || "\u0648\u0635\u0648\u0644" },
    { value: "badges", label: t("typeBadges") || "\u0634\u0627\u0631\u0627\u062a" },
    { value: "physical", label: t("typePhysical") || "\u0645\u0627\u062f\u064a" },
  ];

  const TIER_LABELS = {
    platinum: t("tierPlatinum") || "Platinum",
    gold: t("tierGold") || "Gold",
    silver: t("tierSilver") || "Silver",
    bronze: t("tierBronze") || "Bronze",
    partner: t("tierPartner") || "Partner",
  };

  // ── Track add/remove ───────────────────────────────────────────────────────
  const addTrack = () => {
    if (!newTrack.name.trim()) return;
    updateData({ tracks: [...tracks, { ...newTrack, id: crypto.randomUUID() }] });
    setNewTrack({ name: "", description: "" });
  };
  const removeTrack = (idx) => updateData({ tracks: tracks.filter((_, i) => i !== idx) });

  // ── Prize add/remove ───────────────────────────────────────────────────────
  const addPrize = () => {
    if (!newPrize.title.trim()) return;
    updateData({
      prizes: [...prizes, { ...newPrize, id: crypto.randomUUID(), fulfillment: "pending", awardedTo: null }],
    });
    setNewPrize({ ...EMPTY_PRIZE });
  };
  const removePrize = (idx) => updateData({ prizes: prizes.filter((_, i) => i !== idx) });

  // ── Sponsor add/remove ─────────────────────────────────────────────────────
  const addSponsor = () => {
    if (!newSponsor.name.trim()) return;
    updateData({ sponsors: [...sponsors, { ...newSponsor, id: crypto.randomUUID() }] });
    setNewSponsor({ ...EMPTY_SPONSOR });
  };
  const removeSponsor = (idx) => updateData({ sponsors: sponsors.filter((_, i) => i !== idx) });

  // ── File upload → Gemini extraction → auto-fill form ───────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const token = await auth.currentUser?.getIdToken(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ai/extract-from-file", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }

      const result = await res.json();
      if (result.wizardData) {
        const extracted = result.wizardData;
        const merged = { ...INITIAL_DATA };

        for (const key of ["title", "description", "targetAudience", "contactEmail", "rules", "format"]) {
          if (extracted[key]) merged[key] = extracted[key];
        }
        if (extracted.location?.name) merged.location = extracted.location;
        if (extracted.schedule) merged.schedule = { ...INITIAL_DATA.schedule, ...extracted.schedule };
        if (extracted.settings) merged.settings = { ...INITIAL_DATA.settings, ...extracted.settings };
        if (extracted.branding) merged.branding = { ...INITIAL_DATA.branding, ...extracted.branding };
        if (extracted.hackathonStart) merged.hackathonStart = extracted.hackathonStart;
        if (extracted.hackathonEnd) merged.hackathonEnd = extracted.hackathonEnd;
        if (extracted.sessionsStart) merged.sessionsStart = extracted.sessionsStart;
        if (extracted.sessionsEnd) merged.sessionsEnd = extracted.sessionsEnd;

        for (const key of ["tracks", "prizes", "judgingCriteria", "sponsors", "faq"]) {
          if (Array.isArray(extracted[key]) && extracted[key].length > 0) {
            merged[key] = extracted[key].map((item) => ({ ...item, id: crypto.randomUUID() }));
          }
        }

        if (result.fileUrl) merged.sourceFileUrl = result.fileUrl;
        setData(merged);
      }

      setShowUpload(false);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Save hackathon (draft or publish) ──────────────────────────────────────
  const saveHackathon = async (isPublic) => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await apiPost("/api/hackathons", { ...data, isPublic });
      return result; // { id, slug }
    } catch (err) {
      setError(err.message || "Failed to create hackathon.");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    const result = await saveHackathon(false);
    if (result) {
      navigate(`/hackathons/${result.slug || result.id}`);
    }
  };

  const handleGeneratePage = async () => {
    if (!data.title.trim()) {
      setError(t("titleRequired") || "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0645\u0637\u0644\u0648\u0628");
      return;
    }
    const result = await saveHackathon(true);
    if (result) {
      setSavedHackathon(result);
      setShowPageGen(true);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: AI Page Generator overlay
  // ══════════════════════════════════════════════════════════════════════════
  if (showPageGen && savedHackathon) {
    return (
      <AIPageGenerator
        data={data}
        hackathonId={savedHackathon.id}
        hackathonSlug={savedHackathon.slug}
        onClose={() => navigate(`/hackathons/${savedHackathon.slug || savedHackathon.id}`)}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: File upload pre-step
  // ══════════════════════════════════════════════════════════════════════════
  if (showUpload) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
        <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center justify-between px-6 md:px-12 shrink-0">
          <h1 className="font-heading font-black text-lg text-foreground">{t("createHackathon")}</h1>
          <button onClick={onClose} className="font-mono font-bold text-lg text-muted-foreground hover:text-destructive transition-colors">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-lg w-full space-y-8 text-center">
            <div>
              <div className="mx-auto w-20 h-20 rounded-full border-2 border-border bg-main/10 flex items-center justify-center mb-4">
                <Sparkles className="h-10 w-10 text-main" />
              </div>
              <h2 className="text-2xl font-black text-foreground">
                {t("uploadFileTitle") || "\u0627\u0628\u062f\u0623 \u0628\u0633\u0631\u0639\u0629 \u0645\u0639 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a"}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t("uploadFileDesc") || "\u0627\u0631\u0641\u0639 \u0645\u0644\u0641 (PDF, Word, PowerPoint) \u064a\u062d\u062a\u0648\u064a \u0639\u0644\u0649 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646 \u0648\u0633\u064a\u0642\u0648\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0628\u0645\u0644\u0621 \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0644 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b"}
              </p>
            </div>

            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`rounded-base border-2 border-dashed p-8 cursor-pointer transition-colors ${
                uploading ? "border-main bg-main/5" : "border-border hover:border-main hover:bg-main/5"
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.pptx,.txt" onChange={handleFileUpload} className="hidden" />
              {uploading ? (
                <div className="space-y-3">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-main border-t-transparent" />
                  <p className="text-sm font-bold text-main">{t("extracting") || "\u062c\u0627\u0631\u064a \u0627\u0633\u062a\u062e\u0631\u0627\u062c \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a..."}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="font-bold text-foreground">{t("dropFile") || "\u0627\u0636\u063a\u0637 \u0644\u0631\u0641\u0639 \u0645\u0644\u0641"}</p>
                  <p className="text-xs text-muted-foreground">PDF, DOCX, PPTX, TXT — {t("maxSize") || "\u062d\u062f \u0623\u0642\u0635\u0649 \u0662\u0660 \u0645\u064a\u062c\u0627\u0628\u0627\u064a\u062a"}</p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{uploadError}</div>
            )}

            <Button variant="neutral" size="lg" onClick={() => setShowUpload(false)} disabled={uploading} className="gap-2">
              <SkipForward className="h-4 w-4" />
              {t("skipUpload") || "\u062a\u062e\u0637\u064a \u0648\u0627\u0628\u062f\u0623 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Main single-page form
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center justify-between px-6 md:px-12 shrink-0">
        <h1 className="font-heading font-black text-lg text-foreground">{t("createHackathon")}</h1>
        <button onClick={onClose} className="font-mono font-bold text-lg text-muted-foreground hover:text-destructive transition-colors">
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ────────────────── Section 1: Basic Info ────────────────── */}
          <Section title={t("basicInfoTitle") || "\u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0627\u062a"} defaultOpen={true}>
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                {t("hackathonTitleLabel") || "\u0627\u0644\u0639\u0646\u0648\u0627\u0646"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={data.title}
                onChange={(e) => updateData({ title: e.target.value })}
                placeholder={t("hackathonTitlePlaceholder") || "\u0627\u0633\u0645 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646"}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t("descriptionLabel2") || "\u0627\u0644\u0648\u0635\u0641"}</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={(e) => updateData({ description: e.target.value })}
                placeholder={t("descriptionPlaceholder2") || "\u0648\u0635\u0641 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646"}
                rows={4}
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="targetAudience">{t("targetAudienceLabel") || "\u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641\u0629"}</Label>
              <Textarea
                id="targetAudience"
                value={data.targetAudience || ""}
                onChange={(e) => updateData({ targetAudience: e.target.value })}
                placeholder={t("targetAudiencePlaceholder") || "\u0645\u0646 \u0647\u0645 \u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0648\u0646 \u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641\u0648\u0646\u061f"}
                rows={2}
              />
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label>{t("formatLabel") || "\u0627\u0644\u0635\u064a\u063a\u0629"}</Label>
              <div className="flex gap-2">
                {[
                  { value: "online", label: t("formatOnline") || "\u0639\u0646 \u0628\u0639\u062f", icon: Monitor },
                  { value: "in-person", label: t("formatInPerson") || "\u062d\u0636\u0648\u0631\u064a", icon: MapPin },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateData({ format: value })}
                    className={`flex items-center gap-2 rounded-base border-2 px-4 py-2 text-sm font-bold transition-colors ${
                      (data.format || "online") === value
                        ? "border-border bg-main text-main-foreground shadow-neo-sm"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* In-person location */}
            {(data.format || "online") === "in-person" && (
              <div className="space-y-4 rounded-base border-2 border-border bg-muted/30 p-4">
                <div className="space-y-2">
                  <Label>{t("locationNameLabel") || "\u0627\u0633\u0645 \u0627\u0644\u0645\u0643\u0627\u0646"}</Label>
                  <Input value={location.name} onChange={(e) => updateLocation("name", e.target.value)} placeholder={t("locationNamePlaceholder")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("locationAddressLabel") || "\u0627\u0644\u0639\u0646\u0648\u0627\u0646"}</Label>
                  <Input value={location.address} onChange={(e) => updateLocation("address", e.target.value)} placeholder={t("locationAddressPlaceholder")} />
                </div>
              </div>
            )}

            {(data.format || "online") === "online" && (
              <div className="rounded-base border-2 border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">{t("discordAutoCreate") || "\u0633\u064a\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0633\u064a\u0631\u0641\u0631 Discord \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b"}</p>
              </div>
            )}

            {/* Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="contactEmail">{t("contactEmailLabel") || "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a"}</Label>
              <Input
                id="contactEmail"
                type="email"
                value={data.contactEmail || ""}
                onChange={(e) => updateData({ contactEmail: e.target.value })}
                placeholder={t("contactEmailPlaceholder") || "email@example.com"}
              />
            </div>
          </Section>

          {/* ────────────────── Section 2: Schedule ────────────────── */}
          <Section title={t("scheduleTitle") || "\u0627\u0644\u062c\u062f\u0648\u0644 \u0627\u0644\u0632\u0645\u0646\u064a"} defaultOpen={true}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("regOpen") || "\u0641\u062a\u062d \u0627\u0644\u062a\u0633\u062c\u064a\u0644"}</Label>
                <Input type="datetime-local" value={schedule.registrationOpen || ""} onChange={(e) => updateSchedule("registrationOpen", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("regClose") || "\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u062a\u0633\u062c\u064a\u0644"}</Label>
                <Input type="datetime-local" value={schedule.registrationClose || ""} onChange={(e) => updateSchedule("registrationClose", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("hackathonStartLabel") || "\u0628\u062f\u0627\u064a\u0629 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646"}</Label>
                <Input type="datetime-local" value={data.hackathonStart || ""} onChange={(e) => updateData({ hackathonStart: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("hackathonEndLabel") || "\u0646\u0647\u0627\u064a\u0629 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646"}</Label>
                <Input type="datetime-local" value={data.hackathonEnd || ""} onChange={(e) => updateData({ hackathonEnd: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("sessionsStartLabel") || "\u0628\u062f\u0627\u064a\u0629 \u0627\u0644\u062c\u0644\u0633\u0627\u062a"}</Label>
                <Input type="datetime-local" value={data.sessionsStart || ""} onChange={(e) => updateData({ sessionsStart: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("sessionsEndLabel") || "\u0646\u0647\u0627\u064a\u0629 \u0627\u0644\u062c\u0644\u0633\u0627\u062a"}</Label>
                <Input type="datetime-local" value={data.sessionsEnd || ""} onChange={(e) => updateData({ sessionsEnd: e.target.value })} />
              </div>
            </div>

            {/* Judging mode */}
            <div className="space-y-3 pt-2">
              <Label>{t("judgingTimeLabel") || "\u0645\u0648\u0639\u062f \u0627\u0644\u062a\u062d\u0643\u064a\u0645"}</Label>
              <div className="flex gap-3">
                {[
                  { value: "during", label: t("judgingDuring") || "\u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646" },
                  { value: "custom", label: t("judgingCustom") || "\u0627\u062e\u062a\u0631 \u062a\u0627\u0631\u064a\u062e" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateData({ judgingMode: value })}
                    className={`rounded-base border-2 px-4 py-2 text-sm font-bold transition-colors ${
                      (data.judgingMode || "during") === value
                        ? "border-border bg-main text-main-foreground shadow-neo-sm"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {(data.judgingMode || "during") === "custom" && (
                <div className="grid gap-5 sm:grid-cols-2 rounded-base border-2 border-border bg-muted/30 p-4">
                  <div className="space-y-2">
                    <Label>{t("judgingStart") || "\u0628\u062f\u0627\u064a\u0629 \u0627\u0644\u062a\u062d\u0643\u064a\u0645"}</Label>
                    <Input type="datetime-local" value={schedule.judgingStart || ""} onChange={(e) => updateSchedule("judgingStart", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("judgingEnd") || "\u0646\u0647\u0627\u064a\u0629 \u0627\u0644\u062a\u062d\u0643\u064a\u0645"}</Label>
                    <Input type="datetime-local" value={schedule.judgingEnd || ""} onChange={(e) => updateSchedule("judgingEnd", e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* ────────────────── Section 3: Tracks ────────────────── */}
          <Section title={t("tracksTitle") || "\u0627\u0644\u0645\u0633\u0627\u0631\u0627\u062a"} defaultOpen={false}>
            {/* Existing tracks */}
            {tracks.length > 0 && (
              <div className="space-y-3">
                {tracks.map((track, idx) => (
                  <div key={track.id || idx} className="flex items-start gap-3 rounded-base border-2 border-border bg-muted/30 p-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground">{track.name}</p>
                      {track.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{track.description}</p>}
                    </div>
                    <button onClick={() => removeTrack(idx)} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add track */}
            <div className="rounded-base border-2 border-dashed border-border p-4 space-y-3">
              <div className="space-y-2">
                <Label>{t("trackNameLabel") || "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u0627\u0631"}</Label>
                <Input value={newTrack.name} onChange={(e) => setNewTrack({ ...newTrack, name: e.target.value })} placeholder="e.g. AI & Machine Learning" />
              </div>
              <div className="space-y-2">
                <Label>{t("trackDescLabel") || "\u0648\u0635\u0641 \u0627\u0644\u0645\u0633\u0627\u0631"}</Label>
                <Textarea value={newTrack.description} onChange={(e) => setNewTrack({ ...newTrack, description: e.target.value })} placeholder={t("trackDescPlaceholder")} rows={2} />
              </div>
              <Button variant="neutral" size="sm" onClick={addTrack} disabled={!newTrack.name.trim()}>
                <Plus className="h-4 w-4" /> {t("addTrackBtn") || "\u0623\u0636\u0641 \u0645\u0633\u0627\u0631"}
              </Button>
            </div>
          </Section>

          {/* ────────────────── Section 4: Prizes ────────────────── */}
          <Section title={t("prizesTitle") || "\u0627\u0644\u062c\u0648\u0627\u0626\u0632"} defaultOpen={false}>
            {/* Existing prizes */}
            {prizes.length > 0 && (
              <div className="space-y-3">
                {prizes.map((prize, idx) => {
                  const catInfo = CATEGORIES.find((c) => c.value === prize.category) || CATEGORIES[0];
                  const CatIcon = catInfo.icon;
                  return (
                    <div key={prize.id || idx} className="flex items-start gap-3 rounded-base border-2 border-border bg-muted/30 p-3">
                      <CatIcon className={`h-4 w-4 mt-1 shrink-0 ${catInfo.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm">
                          {prize.place && <span className="text-main">{prize.place} — </span>}
                          {prize.title}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {prize.value && (
                            <span className="inline-flex items-center rounded-base border border-border bg-main/10 px-2 py-0.5 text-xs font-bold text-main">
                              {prize.value}
                            </span>
                          )}
                          <span className="inline-flex items-center rounded-base border border-border px-2 py-0.5 text-xs text-muted-foreground">
                            {TYPES.find((tp) => tp.value === prize.type)?.label || prize.type}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => removePrize(idx)} className="shrink-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add prize */}
            <div className="rounded-base border-2 border-dashed border-border p-4 space-y-4">
              {/* Category selector */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setNewPrize({ ...newPrize, category: cat.value })}
                    className={`flex items-center gap-1.5 rounded-base border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
                      newPrize.category === cat.value
                        ? "bg-main text-main-foreground border-border shadow-neo-sm"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <cat.icon className="h-3.5 w-3.5" />
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>{t("prizePlace") || "\u0627\u0644\u0645\u0631\u0643\u0632"}</Label>
                  <Input value={newPrize.place} onChange={(e) => setNewPrize({ ...newPrize, place: e.target.value })} placeholder="1st Place" />
                </div>
                <div className="space-y-1">
                  <Label>{t("prizeTitleLabel") || "\u0627\u0633\u0645 \u0627\u0644\u062c\u0627\u0626\u0632\u0629"}</Label>
                  <Input value={newPrize.title} onChange={(e) => setNewPrize({ ...newPrize, title: e.target.value })} placeholder="Grand Prize" />
                </div>
                <div className="space-y-1">
                  <Label>{t("prizeValueLabel") || "\u0627\u0644\u0642\u064a\u0645\u0629"}</Label>
                  <Input value={newPrize.value} onChange={(e) => setNewPrize({ ...newPrize, value: e.target.value })} placeholder="$5,000" />
                </div>
                <div className="space-y-1">
                  <Label>{t("prizeType") || "\u0627\u0644\u0646\u0648\u0639"}</Label>
                  <select
                    value={newPrize.type}
                    onChange={(e) => setNewPrize({ ...newPrize, type: e.target.value })}
                    className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-medium"
                  >
                    {TYPES.map((tp) => (
                      <option key={tp.value} value={tp.value}>{tp.label}</option>
                    ))}
                  </select>
                </div>

                {newPrize.category === "per_track" && tracks.length > 0 && (
                  <div className="space-y-1 sm:col-span-2">
                    <Label>{t("trackLabel") || "Track"}</Label>
                    <select
                      value={newPrize.trackId}
                      onChange={(e) => setNewPrize({ ...newPrize, trackId: e.target.value })}
                      className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-medium"
                    >
                      <option value="">{t("selectTrack") || "\u0627\u062e\u062a\u0631 \u0645\u0633\u0627\u0631..."}</option>
                      {tracks.map((tk) => (
                        <option key={tk.id} value={tk.id}>{tk.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {newPrize.category === "sponsor" && (
                  <div className="space-y-1 sm:col-span-2">
                    <Label>{t("sponsorNameLabel") || "\u0627\u0633\u0645 \u0627\u0644\u0631\u0627\u0639\u064a"}</Label>
                    <Input value={newPrize.sponsorName} onChange={(e) => setNewPrize({ ...newPrize, sponsorName: e.target.value })} placeholder={t("sponsorNamePlaceholder") || "\u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629"} />
                  </div>
                )}
              </div>

              <Button variant="neutral" size="sm" onClick={addPrize} disabled={!newPrize.title.trim()}>
                <Plus className="h-4 w-4" /> {t("addPrizeBtn") || "\u0623\u0636\u0641 \u062c\u0627\u0626\u0632\u0629"}
              </Button>
            </div>
          </Section>

          {/* ────────────────── Section 5: Sponsors ────────────────── */}
          <Section title={t("sponsorsTitle") || "\u0627\u0644\u0631\u0639\u0627\u0629"} defaultOpen={false}>
            {/* Existing sponsors */}
            {sponsors.length > 0 && (
              <div className="space-y-3">
                {sponsors.map((sponsor, idx) => (
                  <div key={sponsor.id || idx} className="flex items-start gap-3 rounded-base border-2 border-border bg-muted/30 p-4">
                    {sponsor.logoUrl ? (
                      <img src={sponsor.logoUrl} alt={sponsor.name} className="h-10 w-10 shrink-0 rounded-base border-2 border-border object-contain" />
                    ) : (
                      <Building2 className="h-5 w-5 shrink-0 text-main mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground">{sponsor.name}</p>
                        <span className={`inline-block rounded-base px-2 py-0.5 text-xs font-bold ${TIER_COLORS[sponsor.tier] || ""}`}>
                          {TIER_LABELS[sponsor.tier] || sponsor.tier}
                        </span>
                      </div>
                      {sponsor.websiteUrl && <p className="text-sm text-main font-bold truncate">{sponsor.websiteUrl}</p>}
                    </div>
                    <button onClick={() => removeSponsor(idx)} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add sponsor */}
            <div className="rounded-base border-2 border-dashed border-border p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>{t("sponsorNameLabel") || "\u0627\u0633\u0645 \u0627\u0644\u0631\u0627\u0639\u064a"}</Label>
                  <Input value={newSponsor.name} onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })} placeholder="Acme Corp" />
                </div>
                <div className="space-y-1">
                  <Label>{t("tierLabel") || "\u0627\u0644\u0641\u0626\u0629"}</Label>
                  <select
                    value={newSponsor.tier}
                    onChange={(e) => setNewSponsor({ ...newSponsor, tier: e.target.value })}
                    className="flex h-10 w-full rounded-base border-2 border-border bg-background px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-main"
                  >
                    {TIERS.map((tier) => (
                      <option key={tier} value={tier}>{TIER_LABELS[tier]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>{t("sponsorLogoLabel") || "\u0631\u0627\u0628\u0637 \u0627\u0644\u0634\u0639\u0627\u0631"}</Label>
                  <Input value={newSponsor.logoUrl} onChange={(e) => setNewSponsor({ ...newSponsor, logoUrl: e.target.value })} placeholder="https://example.com/logo.png" />
                </div>
                <div className="space-y-1">
                  <Label>{t("sponsorWebsiteLabel") || "\u0627\u0644\u0645\u0648\u0642\u0639"}</Label>
                  <Input value={newSponsor.websiteUrl} onChange={(e) => setNewSponsor({ ...newSponsor, websiteUrl: e.target.value })} placeholder="https://example.com" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>{t("sponsorDescLabel") || "\u0648\u0635\u0641"}</Label>
                <Textarea
                  value={newSponsor.description}
                  onChange={(e) => setNewSponsor({ ...newSponsor, description: e.target.value })}
                  placeholder={t("sponsorDescPlaceholder") || "\u0648\u0635\u0641 \u0645\u062e\u062a\u0635\u0631 \u0644\u0644\u0631\u0627\u0639\u064a"}
                  rows={2}
                />
              </div>
              <Button variant="neutral" size="sm" onClick={addSponsor} disabled={!newSponsor.name.trim()}>
                <Plus className="h-4 w-4" /> {t("addSponsor") || "\u0623\u0636\u0641 \u0631\u0627\u0639\u064a"}
              </Button>
            </div>
          </Section>

          {/* ────────────────── Error ────────────────── */}
          {error && (
            <div className="rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          {/* ────────────────── Bottom buttons ────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t-2 border-border">
            <Button variant="neutral" size="lg" onClick={handleSaveDraft} disabled={submitting} className="gap-2">
              <Save className="h-4 w-4" />
              {submitting ? "..." : (t("saveDraft") || "\u062d\u0641\u0638 \u0643\u0645\u0633\u0648\u062f\u0629")}
            </Button>
            <Button size="lg" onClick={handleGeneratePage} disabled={submitting} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {submitting ? "..." : (t("generatePageBtn") || "\u2728 \u0623\u0646\u0634\u0626 \u0635\u0641\u062d\u0629 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
