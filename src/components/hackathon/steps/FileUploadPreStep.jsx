import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { Upload, Sparkles, SkipForward, X } from "lucide-react";
import { auth } from "@/firebase";

// ── Initial form data (reference for merging) ───────────────────────────────
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
  judgingMode: "during",
  tracks: [],
  judgingCriteria: [],
  prizes: [],
  settings: { maxRegistrants: 500, teamSizeMin: 2, teamSizeMax: 5, allowSolo: false },
  branding: { logoUrl: "", bannerUrl: "", primaryColor: "#7C3AED", secondaryColor: "#00D4AA", hashtag: "" },
  sponsors: [],
  faq: [],
  isPublic: true,
};

/**
 * FileUploadPreStep — file upload UI + Gemini extraction logic.
 *
 * Props:
 *   onDataExtracted(mergedData) — called with the merged form data after AI extraction
 *   onSkip()                    — called when user clicks "skip"
 *   onClose()                   — called when user clicks X to close the wizard
 *   initialData                 — optional reference data (defaults to INITIAL_DATA)
 */
export default function FileUploadPreStep({ onDataExtracted, onSkip, onClose, initialData }) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [extractLang, setExtractLang] = useState("ar");

  const baseData = initialData || INITIAL_DATA;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const normalizeDate = (d) => {
    if (!d || typeof d !== "string") return "";
    return d
      .replace(/Z$/, "")
      .replace(/:\d{2}\.\d+$/, "")
      .replace(/:\d{2}$/, (m) => m)
      .substring(0, 16);
  };

  // ── Backend-based extraction (Gemini key stays server-side) ─────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      // Send file to backend for Gemini extraction
      const formData = new FormData();
      formData.append("file", file);

      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/ai/extract-from-file", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const result = await res.json();
      const extracted = result.wizardData;

      if (extracted) {
        console.log("[Extract] Raw data from backend:", extracted);
        const merged = { ...baseData };

        for (const key of ["title", "description", "targetAudience", "contactEmail", "format", "rules"]) {
          if (extracted[key]) merged[key] = extracted[key];
        }
        if (extracted.location?.name) merged.location = extracted.location;
        if (extracted.schedule) {
          merged.schedule = { ...baseData.schedule };
          for (const k of ["registrationOpen", "registrationClose", "judgingStart", "judgingEnd"]) {
            if (extracted.schedule[k]) merged.schedule[k] = normalizeDate(extracted.schedule[k]);
          }
          if (extracted.schedule.hackathonStart) merged.hackathonStart = normalizeDate(extracted.schedule.hackathonStart);
          if (extracted.schedule.hackathonEnd) merged.hackathonEnd = normalizeDate(extracted.schedule.hackathonEnd);
          if (extracted.schedule.sessionsStart) merged.sessionsStart = normalizeDate(extracted.schedule.sessionsStart);
          if (extracted.schedule.sessionsEnd) merged.sessionsEnd = normalizeDate(extracted.schedule.sessionsEnd);
        }
        for (const key of ["tracks", "prizes", "faq"]) {
          if (Array.isArray(extracted[key]) && extracted[key].length > 0) {
            merged[key] = extracted[key].map((item) => ({ ...item, id: crypto.randomUUID() }));
          }
        }
        // Sponsors: normalize field names (website → websiteUrl)
        if (Array.isArray(extracted.sponsors) && extracted.sponsors.length > 0) {
          merged.sponsors = extracted.sponsors.map((s) => ({
            id: crypto.randomUUID(),
            name: s.name || "",
            tier: s.tier || "gold",
            websiteUrl: s.websiteUrl || s.website || "",
            logoUrl: s.logoUrl || "",
            description: s.description || "",
          }));
        }
        console.log("[Extract] Merged:", { sponsors: merged.sponsors?.length, faq: merged.faq?.length, tracks: merged.tracks?.length });
        onDataExtracted(merged);
      } else {
        onSkip();
      }
    } catch (err) {
      console.error("Gemini extraction error:", err);
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      <header className="h-16 border-b-2 border-border bg-secondary-background flex items-center justify-between px-6 md:px-12 shrink-0">
        <h1 className="font-heading font-black text-lg text-foreground">{t("createHackathon")}</h1>
        <button
          onClick={onClose}
          className="font-mono font-bold text-lg text-muted-foreground hover:text-destructive transition-colors"
        >
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
              {t("uploadFileDesc") ||
                "\u0627\u0631\u0641\u0639 \u0645\u0644\u0641 (PDF, Word, PowerPoint) \u064a\u062d\u062a\u0648\u064a \u0639\u0644\u0649 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646 \u0648\u0633\u064a\u0642\u0648\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0628\u0645\u0644\u0621 \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0644 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b"}
            </p>
          </div>

          {/* Language selector for extraction */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">{t("extractionLang") || "\u0644\u063a\u0629 \u0627\u0644\u0627\u0633\u062a\u062e\u0631\u0627\u062c:"}</span>
            <button
              onClick={() => setExtractLang("ar")}
              className={`px-3 py-1.5 rounded-base text-sm font-bold border-2 transition-colors ${
                extractLang === "ar"
                  ? "bg-main text-main-foreground border-border"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => setExtractLang("en")}
              className={`px-3 py-1.5 rounded-base text-sm font-bold border-2 transition-colors ${
                extractLang === "en"
                  ? "bg-main text-main-foreground border-border"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              English
            </button>
          </div>

          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`rounded-base border-2 border-dashed p-8 cursor-pointer transition-colors ${
              uploading ? "border-main bg-main/5" : "border-border hover:border-main hover:bg-main/5"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.pptx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            {uploading ? (
              <div className="space-y-3">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-main border-t-transparent" />
                <p className="text-sm font-bold text-main">
                  {t("extracting") || "\u062c\u0627\u0631\u064a \u0627\u0633\u062a\u062e\u0631\u0627\u062c \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a..."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="font-bold text-foreground">
                  {t("dropFile") || "\u0627\u0636\u063a\u0637 \u0644\u0631\u0641\u0639 \u0645\u0644\u0641"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX, PPTX, TXT — {t("maxSize") || "\u062d\u062f \u0623\u0642\u0635\u0649 \u0662\u0660 \u0645\u064a\u062c\u0627\u0628\u0627\u064a\u062a"}
                </p>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {uploadError}
            </div>
          )}

          <Button variant="neutral" size="lg" onClick={onSkip} disabled={uploading} className="gap-2">
            <SkipForward className="h-4 w-4" />
            {t("skipUpload") || "\u062a\u062e\u0637\u064a \u0648\u0627\u0628\u062f\u0623 \u0645\u0646 \u0627\u0644\u0635\u0641\u0631"}
          </Button>
        </div>
      </div>
    </div>
  );
}
