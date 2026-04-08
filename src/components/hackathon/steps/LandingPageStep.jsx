import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/LanguageContext";
import { auth } from "@/firebase";
import {
  Sparkles,
  Code,
  Eye,
  Send,
  FileText,
  Download,
  Save,
  ArrowRight,
  Brain,
} from "lucide-react";

// Direct Cloud Run URL — bypasses Firebase Hosting's 60s proxy timeout
const AI_BASE = "https://api-fypvzcj7kq-uc.a.run.app";

async function aiPost(path, body) {
  const token = await auth.currentUser?.getIdToken(true);
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${AI_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Server error: ${res.status}`);
  }
  return res.json();
}

/**
 * LandingPageStep — AI-powered landing page generator (Step 3).
 */
export default function LandingPageStep({ hackathonData, registrationForm, onPublish, onSaveDraft, onBack }) {
  const { t, language } = useLanguage();
  const [pageHtml, setPageHtml] = useState("");
  const [generating, setGenerating] = useState(false);
  const [chatPrompt, setChatPrompt] = useState("");
  const [improving, setImproving] = useState(false);
  const [activeView, setActiveView] = useState("preview");
  const [genError, setGenError] = useState(null);

  // ── Thinking progress bar ────────────────────────────────────────────────
  const [progress, setProgress] = useState(0);
  const [thinkingMessage, setThinkingMessage] = useState("");
  const progressRef = useRef(null);

  const thinkingSteps = language === "ar"
    ? [
        "جاري تحليل بيانات الهاكاثون...",
        "يفكر الذكاء الاصطناعي في التصميم...",
        "ينشئ الأقسام والمحتوى...",
        "يطبق الألوان والأنماط...",
        "يضيف التجاوب والرسوم المتحركة...",
        "يراجع ويحسن الصفحة...",
        "اللمسات الأخيرة...",
      ]
    : [
        "Analyzing hackathon data...",
        "AI is thinking about design...",
        "Creating sections and content...",
        "Applying colors and styles...",
        "Adding responsiveness and animations...",
        "Reviewing and improving the page...",
        "Final touches...",
      ];

  const startProgress = () => {
    setProgress(0);
    setThinkingMessage(thinkingSteps[0]);
    let step = 0;
    progressRef.current = setInterval(() => {
      step++;
      if (step < thinkingSteps.length) {
        setThinkingMessage(thinkingSteps[step]);
        setProgress(Math.min(90, (step / thinkingSteps.length) * 100));
      } else {
        setProgress(90); // Cap at 90 until done
      }
    }, 8000); // ~8s per step, total ~56s
  };

  const stopProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(100);
    setTimeout(() => setProgress(0), 500);
  };

  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    startProgress();
    try {
      const result = await aiPost("/api/ai/generate-landing-page", { wizardData: hackathonData });
      if (result.html) setPageHtml(result.html);
    } catch (err) {
      setGenError(err.message);
    } finally {
      stopProgress();
      setGenerating(false);
    }
  };

  const handleImprove = async () => {
    if (!chatPrompt.trim() || !pageHtml) return;
    setImproving(true);
    setGenError(null);
    try {
      const result = await aiPost("/api/ai/improve-landing-page", {
        currentHtml: pageHtml,
        instruction: chatPrompt,
        wizardData: hackathonData,
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
    a.download = `${(hackathonData.title || "hackathon").toLowerCase().replace(/\s+/g, "-")}-page.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Title */}
      <h2 className="text-xl font-black text-foreground">
        {language === "ar" ? "صفحة الهاكاثون" : "Hackathon Landing Page"}
      </h2>

      {/* Generate / Preview area */}
      {!pageHtml && !generating && (
        <div className="text-center py-16 rounded-base border-2 border-dashed border-border space-y-4">
          <Sparkles className="h-12 w-12 text-main mx-auto" />
          <p className="text-muted-foreground">
            {language === "ar"
              ? "اضغط لإنشاء صفحة هاكاثون احترافية بالذكاء الاصطناعي"
              : "Click to generate a professional hackathon page with AI"}
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button size="lg" onClick={handleGenerate} className="gap-2">
              <Sparkles className="h-5 w-5" />
              {language === "ar" ? "✨ أنشئ صفحة الهاكاثون" : "✨ Generate Landing Page"}
            </Button>
            <label className="cursor-pointer text-sm text-muted-foreground hover:text-main transition-colors">
              <input type="file" accept=".html,.htm" onChange={handleFileUpload} className="hidden" />
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {language === "ar" ? "أو ارفع ملف HTML" : "or upload HTML file"}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* ── Thinking / Progress Bar ────────────────────────────────────── */}
      {generating && (
        <div className="rounded-base border-2 border-border bg-card p-8 space-y-5">
          <div className="flex items-center justify-center gap-3">
            <Brain className="h-8 w-8 text-main animate-pulse" />
            <h3 className="text-lg font-black text-foreground">
              {language === "ar" ? "الذكاء الاصطناعي يفكر..." : "AI is thinking..."}
            </h3>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-3 border-2 border-border overflow-hidden">
            <div
              className="h-full bg-main rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Current thinking step */}
          <p className="text-sm text-muted-foreground text-center animate-pulse">
            {thinkingMessage}
          </p>

          {/* Dots animation */}
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-main"
                style={{
                  animation: "pulse 1.5s ease-in-out infinite",
                  animationDelay: `${i * 0.3}s`,
                  opacity: 0.4,
                }}
              />
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {language === "ar"
              ? "قد يستغرق الأمر دقيقة أو اثنتين — الذكاء الاصطناعي يصمم صفحة مميزة لك"
              : "This may take 1-2 minutes — AI is crafting a unique page for you"}
          </p>
        </div>
      )}

      {/* Preview */}
      {pageHtml && activeView === "preview" && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Button variant="noShadow" size="sm" onClick={() => setActiveView("code")}>
              <Code className="h-3.5 w-3.5" /> {language === "ar" ? "الكود" : "Code"}
            </Button>
            <Button variant="noShadow" size="sm" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" /> {language === "ar" ? "تحميل" : "Download"}
            </Button>
            <Button variant="noShadow" size="sm" onClick={handleGenerate} disabled={generating}>
              <Sparkles className="h-3.5 w-3.5" /> {language === "ar" ? "إعادة إنشاء" : "Regenerate"}
            </Button>
          </div>
          <div className="rounded-base border-2 border-border overflow-hidden">
            <iframe srcDoc={pageHtml} className="w-full h-[600px] bg-white" title="Preview" sandbox="allow-scripts" />
          </div>
        </div>
      )}

      {/* Code editor */}
      {pageHtml && activeView === "code" && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Button variant="noShadow" size="sm" onClick={() => setActiveView("preview")}>
              <Eye className="h-3.5 w-3.5" /> {language === "ar" ? "معاينة" : "Preview"}
            </Button>
          </div>
          <textarea
            value={pageHtml}
            onChange={(e) => setPageHtml(e.target.value)}
            className="w-full h-[500px] rounded-base border-2 border-border bg-background p-4 font-mono text-xs resize-none"
            dir="ltr"
            spellCheck={false}
          />
        </div>
      )}

      {/* Chat to improve */}
      {pageHtml && (
        <div className="flex gap-2">
          <Textarea
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            placeholder={language === "ar"
              ? "اكتب تعديلاتك... مثال: غيّر الألوان، أضف قسم الرعاة، اجعل الخط أكبر"
              : "Describe changes... e.g. change colors, add sponsors section, make fonts larger"}
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
            {improving ? "..." : language === "ar" ? "عدّل" : "Improve"}
          </Button>
        </div>
      )}

      {/* Error */}
      {genError && (
        <div className="rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {genError}
        </div>
      )}

      {/* Navigation: Back / Save Draft */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t-2 border-border">
        <Button variant="neutral" size="lg" onClick={onBack} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          {language === "ar" ? "رجوع" : "Back"}
        </Button>
        <Button size="lg" onClick={() => onSaveDraft(pageHtml || null)} className="gap-2">
          <Save className="h-4 w-4" />
          {language === "ar" ? "حفظ" : "Save"}
        </Button>
      </div>
    </div>
  );
}
