import { GoogleGenerativeAI } from "@google/generative-ai";

let model = null;
function getModel() {
  if (model) return model;
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) return null;
  const genAI = new GoogleGenerativeAI(key);
  model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  return model;
}

/**
 * Given current wizard data, suggest content for the next step.
 * @param {string} targetStep - which step needs suggestions
 * @param {object} currentData - all data collected so far
 * @returns {object} suggested fields for the target step
 */
export async function suggestForStep(targetStep, currentData) {
  const m = getModel();
  if (!m) return null;

  const context = `You are helping an organizer create a hackathon. Here's what they've entered so far:
Title: ${currentData.title || "Not set"}
Tagline: ${currentData.tagline || "Not set"}
Description: ${currentData.description || "Not set"}
Format: ${currentData.format || "online"}
Target Audience: ${currentData.targetAudience || "Not set"}
Location: ${currentData.location?.name || "Not set"}
Why Participate: ${currentData.whyParticipate || "Not set"}
How It Works: ${currentData.howItWorks || "Not set"}
${currentData.tracks?.length ? `Tracks: ${currentData.tracks.map(t => t.name).join(", ")}` : ""}
${currentData.schedule?.registrationOpen ? `Registration opens: ${currentData.schedule.registrationOpen}` : ""}`;

  const prompts = {
    schedule: `${context}\n\nSuggest realistic dates for this hackathon. Return JSON only:\n{"registrationOpen":"2026-MM-DDT00:00","registrationClose":"2026-MM-DDT23:59","submissionDeadline":"2026-MM-DDT23:59","judgingStart":"2026-MM-DDT09:00","judgingEnd":"2026-MM-DDT18:00"}`,
    tracks: `${context}\n\nSuggest 3 relevant tracks/categories for this hackathon. Return JSON array only:\n[{"name":"Track Name","description":"Brief description"}]`,
    judging: `${context}\n\nSuggest 5 judging criteria with weights totaling 100. Return JSON array only:\n[{"name":"Criterion","weight":25,"maxScore":5}]`,
    prizes: `${context}\n\nSuggest prizes for this hackathon. Return JSON array only:\n[{"place":"1st","title":"Grand Prize","value":"$5,000","category":"overall","type":"cash"}]`,
    resources: `${context}\n\nSuggest 3-4 resources for participants. Return JSON array only:\n[{"title":"Resource Name","type":"template","url":"https://example.com","autoSendOnAccept":true}]`,
    faq: `${context}\n\nSuggest 5 FAQ questions and answers for this hackathon. Return JSON array only:\n[{"question":"Q?","answer":"A"}]`,
  };

  const prompt = prompts[targetStep];
  if (!prompt) return null;

  try {
    const result = await m.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch (err) {
    console.warn("[AI Suggest] Failed:", err.message);
    return null;
  }
}
