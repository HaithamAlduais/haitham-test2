import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateHackathonPage, improvePageWithAI } from "@/services/geminiService";
import { Code, Eye, Wand2, Palette, Download, Copy, RefreshCw, Sparkles, Layout } from "lucide-react";

// Style presets with descriptions
const STYLE_PRESETS = [
  { id: "neo-brutalism", name: "Neo-Brutalism", desc: "Bold borders, harsh shadows, raw colors, thick outlines", preview: "bg-yellow-300 border-4 border-black shadow-[4px_4px_0px_black]" },
  { id: "glassmorphism", name: "Glassmorphism", desc: "Frosted glass, blur effects, transparency, soft gradients", preview: "bg-white/20 backdrop-blur border border-white/30" },
  { id: "dark-elegant", name: "Dark Elegant", desc: "Dark backgrounds, gold accents, serif fonts, luxury feel", preview: "bg-gray-900 border border-yellow-500/30 text-yellow-400" },
  { id: "minimal-clean", name: "Minimal Clean", desc: "Lots of whitespace, thin fonts, subtle colors, clean lines", preview: "bg-white border border-gray-200 text-gray-800" },
  { id: "cyberpunk", name: "Cyberpunk", desc: "Neon colors, dark backgrounds, glitch effects, futuristic", preview: "bg-black border border-cyan-400 text-cyan-400" },
  { id: "retro-vintage", name: "Retro Vintage", desc: "Warm colors, paper textures, vintage typography, nostalgic", preview: "bg-amber-50 border-2 border-amber-800 text-amber-900" },
  { id: "gradient-modern", name: "Gradient Modern", desc: "Bold gradients, rounded cards, modern sans-serif, vibrant", preview: "bg-gradient-to-r from-purple-600 to-pink-500 text-white" },
  { id: "corporate-pro", name: "Corporate Pro", desc: "Professional, blue palette, structured layout, trustworthy", preview: "bg-blue-50 border border-blue-200 text-blue-900" },
  { id: "nature-organic", name: "Nature Organic", desc: "Green tones, rounded shapes, earthy feel, natural imagery", preview: "bg-green-50 border border-green-300 text-green-900" },
  { id: "arabic-islamic", name: "Arabic / Islamic", desc: "Geometric patterns, Arabic-friendly fonts, RTL support, ornamental", preview: "bg-emerald-900 border border-gold text-amber-200" },
];

export default function PageBuilder({ hackathonData, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState("design"); // design | code | preview
  const [selectedStyle, setSelectedStyle] = useState("neo-brutalism");
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [improving, setImproving] = useState(false);
  const [error, setError] = useState(null);
  const previewRef = useRef(null);

  // Generate page with AI
  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const html = await generateHackathonPage({
        hackathonData: hackathonData || {},
        style: STYLE_PRESETS.find(s => s.id === selectedStyle)?.desc || selectedStyle,
        customPrompt: aiPrompt,
      });
      setHtmlCode(html);
      setCssCode("");
      setJsCode("");
      setActiveTab("preview");
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Improve with AI instruction
  const handleImprove = async () => {
    if (!aiPrompt.trim() || !htmlCode) return;
    setImproving(true);
    setError(null);
    try {
      const improved = await improvePageWithAI({
        currentHtml: getFullHtml(),
        instruction: aiPrompt,
      });
      setHtmlCode(improved);
      setAiPrompt("");
      setActiveTab("preview");
    } catch (err) {
      setError(err.message);
    } finally {
      setImproving(false);
    }
  };

  // Combine HTML + CSS + JS
  const getFullHtml = useCallback(() => {
    if (!cssCode && !jsCode) return htmlCode;
    let full = htmlCode;
    if (cssCode) {
      const styleTag = `<style>\n${cssCode}\n</style>`;
      if (full.includes("</head>")) {
        full = full.replace("</head>", `${styleTag}\n</head>`);
      } else {
        full = styleTag + "\n" + full;
      }
    }
    if (jsCode) {
      const scriptTag = `<script>\n${jsCode}\n</script>`;
      if (full.includes("</body>")) {
        full = full.replace("</body>", `${scriptTag}\n</body>`);
      } else {
        full += "\n" + scriptTag;
      }
    }
    return full;
  }, [htmlCode, cssCode, jsCode]);

  // Download HTML file
  const handleDownload = () => {
    const blob = new Blob([getFullHtml()], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(hackathonData?.title || "hackathon").toLowerCase().replace(/\s+/g, "-")}-page.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard?.writeText(getFullHtml());
  };

  // Save the page HTML to hackathon data
  const handleSave = () => {
    onSave?.({
      customPageHtml: getFullHtml(),
      customPageStyle: selectedStyle,
      hasCustomPage: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b-2 border-border bg-secondary-background flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Layout className="h-5 w-5 text-main" />
          <h1 className="font-heading font-black text-base text-foreground">Page Builder</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="neutral" size="sm" onClick={handleCopy} disabled={!htmlCode}>
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
          <Button variant="neutral" size="sm" onClick={handleDownload} disabled={!htmlCode}>
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!htmlCode}>
            Save to Hackathon
          </Button>
          <button onClick={onClose} className="font-mono font-bold text-muted-foreground hover:text-destructive ml-2">✕</button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="border-b-2 border-border bg-secondary-background px-4 py-2 flex items-center gap-2 shrink-0">
        {[
          { id: "design", label: "Design", icon: Palette },
          { id: "code", label: "Code Editor", icon: Code },
          { id: "preview", label: "Live Preview", icon: Eye },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-base text-xs font-bold border-2 transition-colors ${
              activeTab === tab.id
                ? "bg-main text-main-foreground border-border shadow-neo-sm"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {/* AI Prompt */}
          <div className="flex items-center gap-1">
            <Input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={htmlCode ? "Tell AI to modify..." : "Custom instructions for AI..."}
              className="w-64 h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && htmlCode) handleImprove();
              }}
            />
            {htmlCode ? (
              <Button size="sm" variant="neutral" onClick={handleImprove} disabled={improving || !aiPrompt.trim()}>
                <Sparkles className="h-3.5 w-3.5" />
                {improving ? "..." : "Improve"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border-b border-destructive px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Design Tab -- Style selector + Generate */}
        {activeTab === "design" && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-8">
              <div>
                <h2 className="text-xl font-black text-foreground mb-2">Choose a Style</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Select a design style, then let Gemini AI generate a stunning hackathon landing page.
                </p>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {STYLE_PRESETS.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`text-left rounded-base border-2 p-4 transition-all ${
                        selectedStyle === style.id
                          ? "border-main bg-main/5 shadow-neo-sm"
                          : "border-border bg-card hover:border-main/50"
                      }`}
                    >
                      {/* Preview swatch */}
                      <div className={`h-8 w-full rounded-base mb-3 ${style.preview}`} />
                      <h3 className="font-bold text-foreground text-sm">{style.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom prompt */}
              <div className="space-y-2">
                <Label>Additional Instructions (optional)</Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., Add a countdown timer, use Arabic text, add particle background, make it more colorful..."
                  rows={3}
                />
              </div>

              {/* Generate button */}
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={generating}
                className="w-full"
              >
                <Wand2 className="h-5 w-5" />
                {generating ? "Generating with Gemini AI..." : `Generate ${STYLE_PRESETS.find(s => s.id === selectedStyle)?.name} Page`}
              </Button>

              {generating && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-main border-t-transparent" />
                  <p className="mt-3 text-sm text-muted-foreground">AI is designing your page...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Code Editor Tab */}
        {activeTab === "code" && (
          <div className="h-full flex flex-col">
            {/* Sub-tabs: HTML / CSS / JS */}
            <div className="border-b border-border px-4 py-1.5 flex gap-2 bg-card shrink-0">
              {["html", "css", "js"].map((lang) => (
                <button
                  key={lang}
                  className="px-3 py-1 rounded-base text-xs font-bold bg-muted text-foreground border border-border hover:bg-main hover:text-main-foreground transition-colors uppercase"
                  onClick={() => {
                    document.getElementById(`editor-${lang}`)?.focus();
                  }}
                >
                  {lang}
                </button>
              ))}
              <Button variant="neutral" size="sm" className="ml-auto" onClick={() => setActiveTab("preview")}>
                <Eye className="h-3.5 w-3.5" /> Preview
              </Button>
            </div>

            <div className="flex-1 grid grid-rows-3 overflow-hidden">
              {/* HTML editor */}
              <div className="border-b border-border flex flex-col overflow-hidden">
                <div className="px-3 py-1 bg-muted text-xs font-bold text-muted-foreground shrink-0">HTML</div>
                <textarea
                  id="editor-html"
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  className="flex-1 w-full p-3 bg-background text-foreground font-mono text-xs resize-none outline-none"
                  spellCheck={false}
                  placeholder={"<!DOCTYPE html>\n<html>\n<head>...</head>\n<body>...</body>\n</html>"}
                />
              </div>

              {/* CSS editor */}
              <div className="border-b border-border flex flex-col overflow-hidden">
                <div className="px-3 py-1 bg-muted text-xs font-bold text-muted-foreground shrink-0">CSS (additional)</div>
                <textarea
                  id="editor-css"
                  value={cssCode}
                  onChange={(e) => setCssCode(e.target.value)}
                  className="flex-1 w-full p-3 bg-background text-foreground font-mono text-xs resize-none outline-none"
                  spellCheck={false}
                  placeholder="/* Additional CSS overrides */"
                />
              </div>

              {/* JS editor */}
              <div className="flex flex-col overflow-hidden">
                <div className="px-3 py-1 bg-muted text-xs font-bold text-muted-foreground shrink-0">JavaScript (additional)</div>
                <textarea
                  id="editor-js"
                  value={jsCode}
                  onChange={(e) => setJsCode(e.target.value)}
                  className="flex-1 w-full p-3 bg-background text-foreground font-mono text-xs resize-none outline-none"
                  spellCheck={false}
                  placeholder="// Additional JavaScript"
                />
              </div>
            </div>
          </div>
        )}

        {/* Live Preview Tab */}
        {activeTab === "preview" && (
          <div className="h-full flex flex-col">
            {htmlCode ? (
              <>
                <div className="px-4 py-2 border-b border-border bg-card flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">Live Preview</span>
                  <Button variant="neutral" size="sm" onClick={() => setActiveTab("code")}>
                    <Code className="h-3.5 w-3.5" /> Edit Code
                  </Button>
                  <Button variant="neutral" size="sm" onClick={handleGenerate} disabled={generating}>
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                  </Button>
                </div>
                <iframe
                  ref={previewRef}
                  srcDoc={getFullHtml()}
                  className="flex-1 w-full bg-white border-0"
                  title="Page Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Wand2 className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">No page generated yet.</p>
                  <Button onClick={() => setActiveTab("design")}>
                    <Palette className="h-4 w-4" /> Choose a Style & Generate
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
