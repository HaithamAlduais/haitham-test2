import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet, apiPatch, apiPost } from "@/utils/apiClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Editor from "@monaco-editor/react";
import {
  Code, Eye, Sparkles, Send, Download, Save, ArrowLeft,
  RefreshCw, Upload, FileText, Loader2, Layout, Split,
  Maximize2, Minimize2, Terminal, Palette, Plus, X
} from "lucide-react";

// ── File tabs system ──────────────────────────────────────────────────────
const DEFAULT_FILES = {
  "index.html": { language: "html", value: "" },
  "style.css": { language: "css", value: "" },
  "script.js": { language: "javascript", value: "" },
};

function getLanguage(filename) {
  if (filename.endsWith(".html") || filename.endsWith(".htm")) return "html";
  if (filename.endsWith(".css")) return "css";
  if (filename.endsWith(".js") || filename.endsWith(".jsx")) return "javascript";
  if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "typescript";
  if (filename.endsWith(".json")) return "json";
  if (filename.endsWith(".md")) return "markdown";
  return "plaintext";
}

export default function PageBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  // ── State ──────────────────────────────────────────────────────────────
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState({ ...DEFAULT_FILES });
  const [activeFile, setActiveFile] = useState("index.html");
  const [previewHtml, setPreviewHtml] = useState("");
  const [layout, setLayout] = useState("split"); // split | editor | preview
  const [generating, setGenerating] = useState(false);
  const [improving, setImproving] = useState(false);
  const [chatPrompt, setChatPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const editorRef = useRef(null);

  // ── Load hackathon + existing page ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
    apiGet(`/api/hackathons/${id}`)
      .catch(() => apiGet(`/api/events/${id}`))
      .then((data) => {
        setHackathon(data);
        if (data.customPageHtml) {
          // Parse existing HTML into separate files
          const html = data.customPageHtml;
          const cssMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
          const jsMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

          let cleanHtml = html;
          if (cssMatch) cleanHtml = cleanHtml.replace(cssMatch[0], '<link rel="stylesheet" href="style.css">');
          if (jsMatch) cleanHtml = cleanHtml.replace(jsMatch[0], '<script src="script.js"></script>');

          setFiles({
            "index.html": { language: "html", value: html },
            "style.css": { language: "css", value: cssMatch?.[1]?.trim() || "" },
            "script.js": { language: "javascript", value: jsMatch?.[1]?.trim() || "" },
          });
        }
      })
      .catch(() => navigate("/events"))
      .finally(() => setLoading(false));
  }, [id, currentUser, navigate]);

  // ── Build combined preview ─────────────────────────────────────────────
  const buildPreview = useCallback(() => {
    let html = files["index.html"]?.value || "";
    const css = files["style.css"]?.value || "";
    const js = files["script.js"]?.value || "";

    // If the HTML already has style/script tags, don't add duplicates
    if (css && !html.includes(css.substring(0, 50))) {
      if (html.includes("</head>")) {
        html = html.replace("</head>", `<style>${css}</style>\n</head>`);
      } else {
        html = `<style>${css}</style>\n${html}`;
      }
    }
    if (js && !html.includes(js.substring(0, 50))) {
      if (html.includes("</body>")) {
        html = html.replace("</body>", `<script>${js}</script>\n</body>`);
      } else {
        html += `\n<script>${js}</script>`;
      }
    }

    setPreviewHtml(html);
  }, [files]);

  useEffect(() => { buildPreview(); }, [buildPreview]);

  // ── File operations ────────────────────────────────────────────────────
  const updateFile = (filename, value) => {
    setFiles(prev => ({ ...prev, [filename]: { ...prev[filename], value } }));
  };

  const addFile = () => {
    const name = prompt("اسم الملف (مثال: utils.js):");
    if (!name) return;
    setFiles(prev => ({ ...prev, [name]: { language: getLanguage(name), value: "" } }));
    setActiveFile(name);
  };

  const removeFile = (filename) => {
    if (["index.html"].includes(filename)) return; // Can't delete main file
    setFiles(prev => {
      const next = { ...prev };
      delete next[filename];
      return next;
    });
    if (activeFile === filename) setActiveFile("index.html");
  };

  // ── Generate page with Gemini ──────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await apiPost("/api/ai/generate-landing-page", { wizardData: hackathon });
      if (result.html) {
        setFiles(prev => ({ ...prev, "index.html": { language: "html", value: result.html } }));
        setActiveFile("index.html");
        setChatHistory(prev => [...prev, { role: "ai", text: "تم إنشاء الصفحة بنجاح ✨" }]);
      }
    } catch (err) {
      setError(err.message);
      setChatHistory(prev => [...prev, { role: "ai", text: `خطأ: ${err.message}` }]);
    } finally {
      setGenerating(false);
    }
  };

  // ── Improve with Gemini chat ───────────────────────────────────────────
  const handleImprove = async () => {
    if (!chatPrompt.trim()) return;
    const userMsg = chatPrompt;
    setChatPrompt("");
    setChatHistory(prev => [...prev, { role: "user", text: userMsg }]);
    setImproving(true);
    setError(null);
    try {
      const currentHtml = files["index.html"]?.value || "";
      const result = await apiPost("/api/ai/improve-landing-page", {
        currentHtml,
        instruction: userMsg,
      });
      if (result.html) {
        setFiles(prev => ({ ...prev, "index.html": { language: "html", value: result.html } }));
        setChatHistory(prev => [...prev, { role: "ai", text: "تم تطبيق التعديلات ✅" }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: "ai", text: `خطأ: ${err.message}` }]);
    } finally {
      setImproving(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  // ── Save to Firestore ──────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const html = previewHtml || files["index.html"]?.value || "";
      await apiPatch(`/api/hackathons/${id}`, { customPageHtml: html, hasCustomPage: true });
      await apiPatch(`/api/events/${id}`, { customPageHtml: html, hasCustomPage: true }).catch(() => {});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  // ── Upload / Download ──────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      const name = file.name;
      const lang = getLanguage(name);
      setFiles(prev => ({ ...prev, [name]: { language: lang, value: content } }));
      setActiveFile(name);
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const html = previewHtml || files["index.html"]?.value || "";
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(hackathon?.title || "hackathon").toLowerCase().replace(/\s+/g, "-")}-page.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Editor mount ───────────────────────────────────────────────────────
  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    // Add Ctrl+S shortcut
    editor.addCommand(2048 + 49, () => handleSave()); // Ctrl+S
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1e1e2e]">
        <Loader2 className="h-8 w-8 animate-spin text-[#89b4fa]" />
      </div>
    );
  }

  const fileNames = Object.keys(files);
  const currentFile = files[activeFile];

  return (
    <div className="flex flex-col h-screen bg-[#1e1e2e] text-[#cdd6f4]">
      {/* ═══ Top Bar ═══ */}
      <header className="h-12 bg-[#181825] border-b border-[#313244] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/hackathons/${id}`)} className="p-1.5 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Layout className="h-4 w-4 text-[#89b4fa]" />
          <span className="text-sm font-bold text-[#cdd6f4]">{t("pageBuilder") || "منشئ الصفحات"}</span>
          <span className="text-xs text-[#6c7086] truncate max-w-[150px]">{hackathon?.title}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Layout toggle */}
          <button onClick={() => setLayout("editor")} className={`p-1.5 rounded transition-colors ${layout === "editor" ? "bg-[#313244] text-[#89b4fa]" : "text-[#6c7086] hover:bg-[#313244]"}`} title="Editor only">
            <Code className="h-4 w-4" />
          </button>
          <button onClick={() => setLayout("split")} className={`p-1.5 rounded transition-colors ${layout === "split" ? "bg-[#313244] text-[#89b4fa]" : "text-[#6c7086] hover:bg-[#313244]"}`} title="Split view">
            <Split className="h-4 w-4" />
          </button>
          <button onClick={() => setLayout("preview")} className={`p-1.5 rounded transition-colors ${layout === "preview" ? "bg-[#313244] text-[#89b4fa]" : "text-[#6c7086] hover:bg-[#313244]"}`} title="Preview only">
            <Eye className="h-4 w-4" />
          </button>

          <div className="w-px h-5 bg-[#313244] mx-1" />

          {/* Actions */}
          <input ref={fileInputRef} type="file" accept=".html,.css,.js,.htm,.json,.md" onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded text-[#6c7086] hover:bg-[#313244] hover:text-[#cdd6f4]" title="Upload file">
            <Upload className="h-4 w-4" />
          </button>
          <button onClick={handleDownload} className="p-1.5 rounded text-[#6c7086] hover:bg-[#313244] hover:text-[#cdd6f4]" title="Download">
            <Download className="h-4 w-4" />
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#89b4fa] text-[#1e1e2e] text-xs font-bold hover:bg-[#74c7ec] disabled:opacity-50 transition-colors" title="Save (Ctrl+S)">
            <Save className="h-3.5 w-3.5" />
            {saving ? "..." : saved ? "✓" : (t("saveChanges") || "حفظ")}
          </button>
        </div>
      </header>

      {/* ═══ File Tabs ═══ */}
      <div className="h-9 bg-[#181825] border-b border-[#313244] flex items-center px-1 overflow-x-auto shrink-0">
        {fileNames.map(name => (
          <button
            key={name}
            onClick={() => setActiveFile(name)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeFile === name
                ? "text-[#cdd6f4] border-[#89b4fa] bg-[#1e1e2e]"
                : "text-[#6c7086] border-transparent hover:text-[#a6adc8] hover:bg-[#1e1e2e]/50"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${name.endsWith(".html") ? "bg-[#fab387]" : name.endsWith(".css") ? "bg-[#89b4fa]" : name.endsWith(".js") ? "bg-[#f9e2af]" : "bg-[#6c7086]"}`} />
            {name}
            {!["index.html"].includes(name) && (
              <span onClick={(e) => { e.stopPropagation(); removeFile(name); }} className="ml-1 hover:text-[#f38ba8] cursor-pointer">
                <X className="h-3 w-3" />
              </span>
            )}
          </button>
        ))}
        <button onClick={addFile} className="p-1.5 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] rounded ml-1" title="New file">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ═══ Main Content: Editor + Preview ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {(layout === "editor" || layout === "split") && (
          <div className={`${layout === "split" ? "w-1/2" : "w-full"} border-r border-[#313244] overflow-hidden`}>
            {currentFile ? (
              <Editor
                height="100%"
                language={currentFile.language}
                value={currentFile.value}
                onChange={(val) => updateFile(activeFile, val || "")}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                  minimap: { enabled: false },
                  padding: { top: 12 },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  tabSize: 2,
                  formatOnPaste: true,
                  automaticLayout: true,
                  lineNumbers: "on",
                  renderLineHighlight: "line",
                  bracketPairColorization: { enabled: true },
                  suggestOnTriggerCharacters: true,
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[#6c7086]">
                Select a file to edit
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {(layout === "preview" || layout === "split") && (
          <div className={`${layout === "split" ? "w-1/2" : "w-full"} bg-white overflow-hidden`}>
            {previewHtml ? (
              <iframe srcDoc={previewHtml} className="w-full h-full border-0" title="Preview" sandbox="allow-scripts allow-same-origin" />
            ) : (
              <div className="flex items-center justify-center h-full bg-[#1e1e2e]">
                <div className="text-center space-y-4">
                  <Sparkles className="h-12 w-12 text-[#89b4fa] mx-auto opacity-50" />
                  <p className="text-[#6c7086]">{t("noPageYet") || "لم يتم إنشاء الصفحة بعد"}</p>
                  <button onClick={handleGenerate} disabled={generating}
                    className="flex items-center gap-2 mx-auto px-4 py-2 rounded bg-[#89b4fa] text-[#1e1e2e] font-bold text-sm hover:bg-[#74c7ec] disabled:opacity-50 transition-colors">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generating ? "..." : (t("generatePage") || "✨ إنشاء بالذكاء الاصطناعي")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Bottom: AI Chat Panel ═══ */}
      <div className="border-t border-[#313244] bg-[#181825]">
        {/* Chat history */}
        {chatHistory.length > 0 && (
          <div className="max-h-32 overflow-y-auto px-4 py-2 space-y-1.5">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`text-xs ${msg.role === "user" ? "text-[#89b4fa]" : "text-[#a6e3a1]"}`}>
                <span className="font-bold">{msg.role === "user" ? "أنت: " : "AI: "}</span>
                {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Chat input */}
        <div className="flex gap-2 px-4 py-3">
          <div className="flex-1 flex items-center gap-2 bg-[#313244] rounded-lg px-3">
            <Sparkles className="h-4 w-4 text-[#89b4fa] shrink-0" />
            <input
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder={t("improvePlaceholder") || "اكتب تعديلاتك... مثال: غيّر الألوان، أضف countdown، اجعل الخط أكبر"}
              className="flex-1 bg-transparent py-2 text-sm text-[#cdd6f4] placeholder-[#6c7086] outline-none"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleImprove(); } }}
            />
          </div>
          <button onClick={handleImprove} disabled={improving || !chatPrompt.trim()}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#89b4fa] text-[#1e1e2e] text-sm font-bold hover:bg-[#74c7ec] disabled:opacity-50 transition-colors">
            {improving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#313244] text-[#cdd6f4] text-sm hover:bg-[#45475a] disabled:opacity-50 transition-colors" title="Regenerate">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-20 end-6 z-50 rounded-lg bg-[#f38ba8]/20 border border-[#f38ba8] px-4 py-3 text-sm text-[#f38ba8] max-w-md">
          {error}
        </div>
      )}
    </div>
  );
}
