import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/LanguageContext";
import { apiPost } from "@/utils/apiClient";
import { Sparkles, Code, Eye, Send, FileText, Download } from "lucide-react";

export default function ReviewPublishStep({ data, onBack, onPublish, onSaveDraft, submitting, error }) {
  const { t } = useLanguage();
  const [pageHtml, setPageHtml] = useState(data.customPageHtml || "");
  const [generating, setGenerating] = useState(false);
  const [chatPrompt, setChatPrompt] = useState("");
  const [improving, setImproving] = useState(false);
  const [activeView, setActiveView] = useState("preview"); // preview | code
  const [genError, setGenError] = useState(null);

  // Generate landing page with AI using ALL wizard data
  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const result = await apiPost("/api/ai/generate-landing-page", { wizardData: data });
      if (result.html) {
        setPageHtml(result.html);
      }
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Improve existing page with a chat prompt
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

  // Handle file upload (HTML/CSS/JS)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPageHtml(ev.target.result);
    };
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

  // Save page HTML before publishing
  const handlePublish = () => {
    if (pageHtml) {
      onPublish?.({ customPageHtml: pageHtml, hasCustomPage: true });
    } else {
      onPublish?.();
    }
  };

  const handleDraft = () => {
    if (pageHtml) {
      onSaveDraft?.({ customPageHtml: pageHtml, hasCustomPage: !!pageHtml });
    } else {
      onSaveDraft?.();
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div>
        <h2 className="text-2xl font-black text-foreground">{t("reviewTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("reviewDesc")}</p>
      </div>

      {/* Quick summary of wizard data */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-base border-2 border-border p-3">
          <p className="text-xs text-muted-foreground">{t("hackathonTitleLabel")}</p>
          <p className="font-bold text-foreground">{data.title || "\u2014"}</p>
        </div>
        <div className="rounded-base border-2 border-border p-3">
          <p className="text-xs text-muted-foreground">{t("formatLabel")}</p>
          <p className="font-bold text-foreground">{data.format === "in-person" ? t("formatInPerson") : t("formatOnline")}</p>
        </div>
        <div className="rounded-base border-2 border-border p-3">
          <p className="text-xs text-muted-foreground">{t("tracksTitle")}</p>
          <p className="font-bold text-foreground">{data.tracks?.length || 0} {t("tracksTitle")}</p>
        </div>
        <div className="rounded-base border-2 border-border p-3">
          <p className="text-xs text-muted-foreground">{t("prizesTitle")}</p>
          <p className="font-bold text-foreground">{data.prizes?.length || 0} {t("prizesTitle")}</p>
        </div>
      </div>

      {/* AI Landing Page Generator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-foreground">
            {t("landingPageTitle") || "\u0635\u0641\u062d\u0629 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646"}
          </h3>
          <div className="flex gap-2">
            {pageHtml && (
              <>
                <Button variant="neutral" size="sm" onClick={() => setActiveView(activeView === "preview" ? "code" : "preview")}>
                  {activeView === "preview" ? <><Code className="h-3.5 w-3.5" /> {t("codeEditor") || "\u0627\u0644\u0643\u0648\u062f"}</> : <><Eye className="h-3.5 w-3.5" /> {t("preview") || "\u0645\u0639\u0627\u064a\u0646\u0629"}</>}
                </Button>
                <Button variant="neutral" size="sm" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5" /> {t("downloadHtml") || "\u062a\u062d\u0645\u064a\u0644"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Generate button */}
        {!pageHtml && (
          <div className="text-center py-12 rounded-base border-2 border-dashed border-border space-y-4">
            <Sparkles className="h-12 w-12 text-main mx-auto" />
            <p className="text-muted-foreground">
              {t("generatePageDesc") || "\u0627\u0636\u063a\u0637 \u0644\u0625\u0646\u0634\u0627\u0621 \u0635\u0641\u062d\u0629 \u0647\u0627\u0643\u0627\u062b\u0648\u0646 \u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a"}
            </p>
            <div className="flex flex-col items-center gap-3">
              <Button size="lg" onClick={handleGenerate} disabled={generating} className="gap-2">
                <Sparkles className="h-5 w-5" />
                {generating ? (t("generatingPage") || "\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0646\u0634\u0627\u0621...") : (t("generatePage") || "\u2728 \u0623\u0646\u0634\u0626 \u0635\u0641\u062d\u0629 \u0627\u0644\u0647\u0627\u0643\u0627\u062b\u0648\u0646")}
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

        {/* Preview / Code editor */}
        {pageHtml && activeView === "preview" && (
          <div className="rounded-base border-2 border-border overflow-hidden">
            <iframe srcDoc={pageHtml} className="w-full h-[500px] bg-white" title="Preview" sandbox="allow-scripts" />
          </div>
        )}

        {pageHtml && activeView === "code" && (
          <textarea
            value={pageHtml}
            onChange={(e) => setPageHtml(e.target.value)}
            className="w-full h-[400px] rounded-base border-2 border-border bg-background p-4 font-mono text-xs resize-none"
            dir="ltr"
            spellCheck={false}
          />
        )}

        {/* Chat with AI to improve */}
        {pageHtml && (
          <div className="flex gap-2">
            <Textarea
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder={t("improvePlaceholder") || "\u0627\u0643\u062a\u0628 \u062a\u0639\u062f\u064a\u0644\u0627\u062a\u0643... \u0645\u062b\u0627\u0644: \u063a\u064a\u0651\u0631 \u0627\u0644\u0623\u0644\u0648\u0627\u0646\u060c \u0623\u0636\u0641 \u0642\u0633\u0645 \u0627\u0644\u0631\u0639\u0627\u0629\u060c \u0627\u062c\u0639\u0644 \u0627\u0644\u062e\u0637 \u0623\u0643\u0628\u0631"}
              rows={2}
              className="flex-1"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleImprove(); } }}
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

      {/* Publish / Draft buttons */}
      {error && <div className="rounded-base border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="neutral" onClick={onBack}>{t("backBtn")}</Button>
        <div className="flex gap-3">
          <Button variant="neutral" onClick={handleDraft} disabled={submitting}>
            {t("saveDraft")}
          </Button>
          <Button onClick={handlePublish} disabled={submitting} size="lg">
            {submitting ? (t("publishing") || "...") : t("publishBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
}
