import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet, apiPatch } from "@/utils/apiClient";
import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";
import {
  Code, Eye, Sparkles, Send, Download, Save, ArrowLeft,
  RefreshCw, Upload, Loader2, Layout, Split
} from "lucide-react";

export default function PageBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [layout, setLayout] = useState("split");
  const [generating, setGenerating] = useState(false);
  const [improving, setImproving] = useState(false);
  const [chatPrompt, setChatPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

  const callGemini = async (prompt) => {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 30000 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
    const data = await res.json();
    let html = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    html = html.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();
    return html;
  };

  // ── Load hackathon ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
    apiGet(`/api/hackathons/${id}`)
      .catch(() => apiGet(`/api/events/${id}`))
      .then((data) => {
        setHackathon(data);
        if (data.customPageHtml) setCode(data.customPageHtml);
      })
      .catch(() => navigate("/events"))
      .finally(() => setLoading(false));
  }, [id, currentUser, navigate]);

  // ── Generate ───────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const h = hackathon || {};
      const prompt = `Create a stunning, complete, single-page HTML landing page for this hackathon. Everything in ONE file — HTML, CSS, JS all embedded.

IMPORTANT: Include these in the <head>:
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">

HACKATHON DATA:
Title: ${h.title || "Hackathon"}
Description: ${h.description || ""}
Target Audience: ${h.targetAudience || ""}
Format: ${h.format || "online"}
Contact: ${h.contactEmail || ""}
Location: ${h.location?.name || ""} ${h.location?.address || ""}
Tracks: ${(h.tracks || []).map(tp => tp.name + ": " + (tp.description || "")).join("; ") || "None"}
Prizes: ${(h.prizes || []).map(p => (p.place || "") + " " + (p.title || "") + ": " + (p.value || "")).join("; ") || "None"}
Schedule: Registration: ${h.schedule?.registrationOpen || "TBD"} - ${h.schedule?.registrationClose || "TBD"}
Hackathon: ${h.hackathonStart || "TBD"} - ${h.hackathonEnd || "TBD"}
Sessions: ${h.sessionsStart || "TBD"} - ${h.sessionsEnd || "TBD"}
Sponsors (MUST include ALL):
${(h.sponsors || []).map(s => `- ${s.name} (${s.tier || "partner"})${s.website ? " " + s.website : ""}`).join("\n") || "None"}
FAQ:
${(h.faq || []).map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n") || "None"}
Primary Color: ${h.branding?.primaryColor || "#7C3AED"}

REQUIREMENTS:
- Single HTML file with embedded <style> and <script>
- Tailwind CSS via CDN
- Tajawal font, dir="rtl" for Arabic
- Sections: Hero with gradient + title, About, Tracks, Prizes, Schedule with countdown timer, Sponsors with ALL names, FAQ accordion, Register CTA, Footer
- Beautiful modern design with gradients, shadows, animations
- Responsive
- Smooth scroll
- Return ONLY raw HTML starting with <!DOCTYPE html>`;

      const html = await callGemini(prompt);
      if (html) {
        setCode(html);
        setChatHistory(prev => [...prev, { role: "ai", text: "تم إنشاء الصفحة بنجاح ✨" }]);
      }
    } catch (err) {
      setError(err.message);
      setChatHistory(prev => [...prev, { role: "ai", text: `خطأ: ${err.message}` }]);
    } finally {
      setGenerating(false);
    }
  };

  // ── Improve ────────────────────────────────────────────────────────────
  const handleImprove = async () => {
    if (!chatPrompt.trim()) return;
    const userMsg = chatPrompt;
    setChatPrompt("");
    setChatHistory(prev => [...prev, { role: "user", text: userMsg }]);
    setImproving(true);
    try {
      const html = await callGemini(`Modify this HTML page. Keep ALL content. Return ONLY complete HTML.

CURRENT HTML:
${code.substring(0, 25000)}

INSTRUCTION: ${userMsg}

Return ONLY raw HTML starting with <!DOCTYPE html>.`);
      if (html) {
        setCode(html);
        setChatHistory(prev => [...prev, { role: "ai", text: "تم التعديل ✅" }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: "ai", text: `خطأ: ${err.message}` }]);
    } finally {
      setImproving(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPatch(`/api/hackathons/${id}`, { customPageHtml: code, hasCustomPage: true });
      await apiPatch(`/api/events/${id}`, { customPageHtml: code, hasCustomPage: true }).catch(() => {});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCode(ev.target.result);
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(hackathon?.title || "page").replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#1e1e2e]"><Loader2 className="h-8 w-8 animate-spin text-[#89b4fa]" /></div>;
  }

  return (
    <div className="flex flex-col h-screen bg-[#1e1e2e] text-[#cdd6f4]">
      {/* ═══ Header ═══ */}
      <header className="h-11 bg-[#181825] border-b border-[#313244] flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/hackathons/${id}`)} className="p-1 rounded hover:bg-[#313244] text-[#6c7086]">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Layout className="h-4 w-4 text-[#89b4fa]" />
          <span className="text-sm font-bold">{t("pageBuilder") || "منشئ الصفحات"}</span>
          <span className="text-xs text-[#6c7086] truncate max-w-[150px]">{hackathon?.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setLayout("editor")} className={`p-1.5 rounded ${layout === "editor" ? "bg-[#313244] text-[#89b4fa]" : "text-[#6c7086] hover:bg-[#313244]"}`}>
            <Code className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setLayout("split")} className={`p-1.5 rounded ${layout === "split" ? "bg-[#313244] text-[#89b4fa]" : "text-[#6c7086] hover:bg-[#313244]"}`}>
            <Split className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setLayout("preview")} className={`p-1.5 rounded ${layout === "preview" ? "bg-[#313244] text-[#89b4fa]" : "text-[#6c7086] hover:bg-[#313244]"}`}>
            <Eye className="h-3.5 w-3.5" />
          </button>
          <div className="w-px h-4 bg-[#313244] mx-1" />
          <input ref={fileInputRef} type="file" accept=".html" onChange={handleUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded text-[#6c7086] hover:bg-[#313244]"><Upload className="h-3.5 w-3.5" /></button>
          <button onClick={handleDownload} className="p-1.5 rounded text-[#6c7086] hover:bg-[#313244]"><Download className="h-3.5 w-3.5" /></button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-2 py-1 rounded bg-[#89b4fa] text-[#1e1e2e] text-xs font-bold hover:bg-[#74c7ec] disabled:opacity-50">
            <Save className="h-3 w-3" />
            {saving ? "..." : saved ? "✓" : "حفظ"}
          </button>
        </div>
      </header>

      {/* ═══ Main: Editor + Preview ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        {(layout === "editor" || layout === "split") && (
          <div className={layout === "split" ? "w-1/2 border-r border-[#313244]" : "w-full"}>
            {code ? (
              <Editor
                height="100%"
                language="html"
                value={code}
                onChange={(val) => setCode(val || "")}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  fontFamily: "'Fira Code', monospace",
                  minimap: { enabled: false },
                  padding: { top: 8 },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  tabSize: 2,
                  automaticLayout: true,
                  lineNumbers: "on",
                  bracketPairColorization: { enabled: true },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <Sparkles className="h-12 w-12 text-[#89b4fa] mx-auto opacity-40" />
                  <p className="text-[#6c7086] text-sm">أنشئ الصفحة أو ارفع ملف HTML</p>
                  <button onClick={handleGenerate} disabled={generating}
                    className="flex items-center gap-2 mx-auto px-4 py-2 rounded bg-[#89b4fa] text-[#1e1e2e] font-bold text-sm hover:bg-[#74c7ec] disabled:opacity-50">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generating ? "جاري الإنشاء..." : "✨ إنشاء بالذكاء الاصطناعي"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {(layout === "preview" || layout === "split") && (
          <div className={layout === "split" ? "w-1/2" : "w-full"}>
            {code ? (
              <iframe srcDoc={code} className="w-full h-full bg-white border-0" title="Preview" sandbox="allow-scripts allow-same-origin" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <Sparkles className="h-12 w-12 text-[#89b4fa] mx-auto opacity-40" />
                  <p className="text-[#6c7086]">لم يتم إنشاء الصفحة بعد</p>
                  <button onClick={handleGenerate} disabled={generating}
                    className="flex items-center gap-2 mx-auto px-4 py-2 rounded bg-[#89b4fa] text-[#1e1e2e] font-bold text-sm hover:bg-[#74c7ec] disabled:opacity-50">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generating ? "..." : "✨ إنشاء بالذكاء الاصطناعي"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ AI Chat Bar ═══ */}
      <div className="border-t border-[#313244] bg-[#181825]">
        {chatHistory.length > 0 && (
          <div className="max-h-24 overflow-y-auto px-4 py-1.5 space-y-1">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`text-xs ${msg.role === "user" ? "text-[#89b4fa]" : "text-[#a6e3a1]"}`}>
                <span className="font-bold">{msg.role === "user" ? "أنت: " : "AI: "}</span>{msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
        <div className="flex gap-2 px-3 py-2">
          <div className="flex-1 flex items-center gap-2 bg-[#313244] rounded px-3">
            <Sparkles className="h-3.5 w-3.5 text-[#89b4fa] shrink-0" />
            <input value={chatPrompt} onChange={(e) => setChatPrompt(e.target.value)}
              placeholder="اكتب تعديلاتك... مثال: غيّر الألوان، أضف countdown، اجعل التصميم أفضل"
              className="flex-1 bg-transparent py-1.5 text-sm text-[#cdd6f4] placeholder-[#6c7086] outline-none"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleImprove(); } }} />
          </div>
          <button onClick={handleImprove} disabled={improving || !chatPrompt.trim()}
            className="px-3 py-1.5 rounded bg-[#89b4fa] text-[#1e1e2e] text-sm font-bold hover:bg-[#74c7ec] disabled:opacity-50">
            {improving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
          <button onClick={handleGenerate} disabled={generating}
            className="px-2 py-1.5 rounded bg-[#313244] text-[#cdd6f4] hover:bg-[#45475a] disabled:opacity-50">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && <div className="fixed bottom-16 end-4 z-50 rounded bg-[#f38ba8]/20 border border-[#f38ba8] px-3 py-2 text-xs text-[#f38ba8]">{error}</div>}
    </div>
  );
}
