/**
 * Ramsha — Gemini AI Integration
 *
 * Builds the hackathon landing page prompt from form data,
 * calls the Gemini API, and returns clean HTML.
 */

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Build the Gemini prompt from hackathon form data.
 */
function buildPrompt(form) {
  const tracks = form.tracks
    .filter((t) => t.name)
    .map((t) => `- ${t.name}: ${t.description}`)
    .join("\n");

  const prizes = form.prizes
    .filter((p) => p.label)
    .map((p) => `- ${p.label}: ${p.value}`)
    .join("\n");

  const schedule = form.schedule
    .filter((s) => s.time)
    .map((s) => `- ${s.time}: ${s.activity}`)
    .join("\n");

  const judges = form.judges
    .filter((j) => j.name)
    .map((j) => `- ${j.name}, ${j.title} (${j.role})`)
    .join("\n");

  return `You are an expert web designer. Create a stunning, complete hackathon landing page in HTML.
Output ONLY raw HTML starting with <!DOCTYPE html> — no markdown, no explanation, no code fences.

HACKATHON DETAILS:
Name: ${form.name}
Tagline: ${form.tagline}
About: ${form.description}
Dates: ${form.startDate} to ${form.endDate}
Registration Deadline: ${form.regDeadline}
Location: ${form.location} (${form.format})
Team Size: ${form.maxTeamSize}
Primary Color: ${form.primaryColor}
Accent Color: ${form.accentColor}
Registration Link: ${form.regLink}

TRACKS:
${tracks || "- General: Open track"}

PRIZES:
${prizes || "- TBA: TBA"}

SCHEDULE:
${schedule || "- TBA: TBA"}

JUDGES & MENTORS:
${judges || "- TBA"}

SPONSORS: ${form.sponsors || "TBA"}

DESIGN REQUIREMENTS:
- Full professional hackathon site (reference: ETHGlobal, MLH events)
- Dark hero section with gradient using ${form.primaryColor} and ${form.accentColor}
- Full-screen hero: big event name, tagline, live JS countdown timer to registration deadline, and a CTA "Register Now" button
- Sections in order:
    1. Hero (full screen, dark, dramatic)
    2. Stats bar (participants count, total prize pool, hours of hacking)
    3. About section
    4. Tracks grid with inline SVG icons
    5. Prizes section with podium visual
    6. Schedule / Timeline
    7. Judges & Mentors cards with initials avatar
    8. Sponsors section
    9. FAQ accordion (5 common hackathon questions)
    10. Footer with register CTA and Ramsha branding
- Google Fonts: Sora (headings) + Inter (body)
- Fully responsive with mobile support
- Sticky navigation bar with event name and Register button
- Smooth scroll behavior
- Scroll-triggered animations using IntersectionObserver
- Countdown timer JavaScript that counts down to the registration deadline
- All CSS inside <style> in <head>
- All JavaScript inside <script> before </body>
- No external CSS/JS libraries — only Google Fonts allowed
- Make it look like a REAL professional event website, not a generic template`;
}

/**
 * Strip markdown code fences from Gemini output.
 */
function stripCodeFences(text) {
  return text
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * Generate a hackathon landing page via Gemini API.
 *
 * @param {Object} form — The hackathon form data
 * @returns {Promise<string>} — Clean HTML string
 */
export async function generateHackathonPage(form) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const prompt = buildPrompt(form);

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192 },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `Gemini API error (${response.status})`
    );
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Gemini returned an empty response.");
  }

  return stripCodeFences(rawText);
}

/**
 * Generate a URL-safe slug from an event name.
 */
export function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
