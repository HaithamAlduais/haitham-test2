import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet, apiPatch, apiPost } from "@/utils/apiClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Code, Eye, Sparkles, Send, Download, Save, ArrowLeft,
  RefreshCw, Upload, FileText, Loader2, Layout
} from "lucide-react";

export default function PageBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [htmlCode, setHtmlCode] = useState("");
  const [activeView, setActiveView] = useState("preview"); // preview | code
  const [generating, setGenerating] = useState(false);
  const [improving, setImproving] = useState(false);
  const [chatPrompt, setChatPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Load hackathon data + existing page
  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
    apiGet(`/api/hackathons/${id}`)
      .catch(() => apiGet(`/api/events/${id}`))
      .then((data) => {
        setHackathon(data);
        if (data.customPageHtml) setHtmlCode(data.customPageHtml);
      })
      .catch(() => navigate("/events"))
      .finally(() => setLoading(false));
  }, [id, currentUser, navigate]);

  // Generate page with Gemini
  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await apiPost("/api/ai/generate-landing-page", { wizardData: hackathon });
      if (result.html) setHtmlCode(result.html);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Improve with Gemini chat
  const handleImprove = async () => {
    if (!chatPrompt.trim() || !htmlCode) return;
    setImproving(true);
    setError(null);
    try {
      const result = await apiPost("/api/ai/improve-landing-page", {
        currentHtml: htmlCode,
        instruction: chatPrompt,
      });
      if (result.html) {
        setHtmlCode(result.html);
        setChatPrompt("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setImproving(false);
    }
  };

  // Save to Firestore
  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPatch(`/api/hackathons/${id}`, { customPageHtml: htmlCode, hasCustomPage: true });
      await apiPatch(`/api/events/${id}`, { customPageHtml: htmlCode, hasCustomPage: true }).catch(() => {});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Upload HTML file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setHtmlCode(ev.target.result);
    reader.readAsText(file);
  };

  // Download HTML
  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(hackathon?.title || "hackathon").toLowerCase().replace(/\s+/g, "-")}-page.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-main" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* ═══ Header ═══ */}
      <header className="h-14 border-b-2 border-border bg-secondary-background flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/hackathons/${id}`)} className="p-1.5 rounded-base hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Layout className="h-5 w-5 text-main" />
          <div>
            <h1 className="font-heading font-black text-sm text-foreground">{t("pageBuilder") || "منشئ الصفحات"}</h1>
            <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{hackathon?.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-base border-2 border-border overflow-hidden">
            <button onClick={() => setActiveView("preview")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold ${activeView === "preview" ? "bg-main text-main-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
              <Eye className="h-3.5 w-3.5" /> {t("previewLabel") || "معاينة"}
            </button>
            <button onClick={() => setActiveView("code")}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold ${activeView === "code" ? "bg-main text-main-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
              <Code className="h-3.5 w-3.5" /> {t("codeEditor") || "الكود"}
            </button>
          </div>

          {/* Actions */}
          <label className="cursor-pointer">
            <input ref={fileInputRef} type="file" accept=".html,.htm" onChange={handleFileUpload} className="hidden" />
            <Button variant="neutral" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
            </Button>
          </label>
          {htmlCode && (
            <Button variant="neutral" size="sm" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || !htmlCode} className="gap-1">
            <Save className="h-3.5 w-3.5" />
            {saving ? "..." : saved ? "✓" : (t("saveChanges") || "حفظ")}
          </Button>
        </div>
      </header>

      {/* ═══ Main content ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor/Preview area */}
        <div className="flex-1 overflow-hidden">
          {!htmlCode ? (
            /* Empty state — generate or upload */
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center space-y-6 max-w-md">
                <Sparkles className="h-16 w-16 text-main mx-auto opacity-50" />
                <div>
                  <h2 className="text-xl font-black text-foreground">{t("noPageYet") || "لم يتم إنشاء الصفحة بعد"}</h2>
                  <p className="text-sm text-muted-foreground mt-2">{t("generateOrUpload") || "أنشئ صفحة بالذكاء الاصطناعي أو ارفع ملف HTML"}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button size="lg" onClick={handleGenerate} disabled={generating} className="gap-2">
                    {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    {generating ? (t("generatingPage") || "جاري الإنشاء...") : (t("generatePage") || "✨ أنشئ بالذكاء الاصطناعي")}
                  </Button>
                  <Button variant="neutral" onClick={() => fileInputRef.current?.click()} className="gap-2">
                    <FileText className="h-4 w-4" /> {t("uploadHtml") || "ارفع ملف HTML"}
                  </Button>
                </div>
              </div>
            </div>
          ) : activeView === "preview" ? (
            /* Preview */
            <iframe srcDoc={htmlCode} className="w-full h-full bg-white border-0" title="Preview" sandbox="allow-scripts allow-same-origin" />
          ) : (
            /* Code Editor */
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              className="w-full h-full p-4 bg-[#1e1e2e] text-[#cdd6f4] font-mono text-sm resize-none outline-none leading-relaxed"
              dir="ltr"
              spellCheck={false}
              placeholder="<!DOCTYPE html>\n<html>..."
            />
          )}
        </div>
      </div>

      {/* ═══ Bottom: Gemini Chat Bar ═══ */}
      {htmlCode && (
        <div className="border-t-2 border-border bg-secondary-background px-4 py-3">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Textarea
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder={t("improvePlaceholder") || "اكتب تعديلاتك... مثال: غيّر الألوان، أضف قسم الرعاة، اجعل الخط أكبر، أضف countdown"}
              rows={1}
              className="flex-1 resize-none"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleImprove(); } }}
            />
            <Button onClick={handleImprove} disabled={improving || !chatPrompt.trim()} className="shrink-0 self-end gap-1">
              {improving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {improving ? "..." : (t("improveBtn") || "عدّل")}
            </Button>
            <Button variant="neutral" onClick={handleGenerate} disabled={generating} className="shrink-0 self-end">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-20 end-6 z-50 rounded-base border-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive max-w-md">
          {error}
        </div>
      )}
    </div>
  );
}
