import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;
let model = null;

function getModel() {
  if (model) return model;
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    console.warn("VITE_GEMINI_API_KEY not set");
    return null;
  }
  genAI = new GoogleGenerativeAI(key);
  model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  return model;
}

/**
 * Generate a hackathon landing page HTML from event data and style preference.
 */
export async function generateHackathonPage({ hackathonData, style, customPrompt }) {
  const m = getModel();
  if (!m) throw new Error("Gemini API not configured");

  const prompt = `You are an expert web designer. Generate a complete, beautiful, single-page HTML landing page for a hackathon.

HACKATHON DATA:
- Title: ${hackathonData.title || "Hackathon"}
- Tagline: ${hackathonData.tagline || ""}
- Description: ${hackathonData.description || ""}
- Tracks: ${(hackathonData.tracks || []).map(t => t.name).join(", ") || "None"}
- Prizes: ${(hackathonData.prizes || []).map(p => `${p.title}: ${p.value}`).join(", ") || "None"}
- Schedule: Registration: ${hackathonData.schedule?.registrationOpen || "TBD"} to ${hackathonData.schedule?.registrationClose || "TBD"}, Submission: ${hackathonData.schedule?.submissionDeadline || "TBD"}
- Rules: ${hackathonData.rules || "None specified"}
- Branding: Primary color: ${hackathonData.branding?.primaryColor || "#7C3AED"}, Secondary: ${hackathonData.branding?.secondaryColor || "#00D4AA"}

DESIGN STYLE: ${style}
${customPrompt ? `ADDITIONAL INSTRUCTIONS: ${customPrompt}` : ""}

Requirements:
- Complete self-contained HTML with embedded CSS and minimal JS
- Include sections: Hero, About, Tracks, Prizes, Schedule, Rules, FAQ, Register CTA
- Use the specified branding colors
- Make it responsive (mobile-friendly)
- Add smooth scroll navigation
- Add subtle animations (CSS only, no heavy libraries)
- Use Google Fonts (load via CDN link)
- Include a "Register Now" button that links to #register
- Make it visually stunning and professional
- The style MUST match the requested design style exactly

Return ONLY the complete HTML code, nothing else. No markdown code blocks, just raw HTML starting with <!DOCTYPE html>.`;

  const result = await m.generateContent(prompt);
  let html = result.response.text();

  // Clean up markdown artifacts if any
  html = html.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();
  if (!html.startsWith("<!DOCTYPE") && !html.startsWith("<html") && !html.startsWith("<!doctype")) {
    // Find the start of HTML
    const idx = html.indexOf("<!DOCTYPE");
    const idx2 = html.indexOf("<html");
    const idx3 = html.indexOf("<!doctype");
    const start = Math.min(...[idx, idx2, idx3].filter(i => i >= 0));
    if (start >= 0) html = html.substring(start);
  }

  return html;
}

/**
 * Improve/modify existing HTML based on a prompt.
 */
export async function improvePageWithAI({ currentHtml, instruction }) {
  const m = getModel();
  if (!m) throw new Error("Gemini API not configured");

  const prompt = `You are an expert web designer. Modify the following HTML page based on the instruction.

CURRENT HTML:
${currentHtml.substring(0, 15000)}

INSTRUCTION: ${instruction}

Return ONLY the complete modified HTML code. No explanations, no markdown blocks, just raw HTML.`;

  const result = await m.generateContent(prompt);
  let html = result.response.text();
  html = html.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();
  return html;
}

export { getModel };
