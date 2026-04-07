/**
 * Ramsha — AI Screening Service (Gemini)
 *
 * Uses Google Gemini API for application and team screening.
 * Falls back gracefully when API key is not configured.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;
let model = null;

function getModel() {
  if (model) return model;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not set — AI screening will be skipped.");
    return null;
  }

  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  return model;
}

/**
 * Evaluate a registration application using Gemini.
 *
 * @param {object} params
 * @param {object} params.hackathon - Hackathon data (title, description, tracks, criteria)
 * @param {object} params.registration - Registration form responses
 * @param {string} params.userEmail - Applicant email
 * @returns {Promise<{score: number, reasoning: string, recommendation: string}>}
 */
async function screenApplication({ hackathon, registration, userEmail }) {
  const gemini = getModel();
  if (!gemini) {
    return { score: 50, reasoning: "AI screening unavailable (API key not configured).", recommendation: "manual_review" };
  }

  // Use organizer's custom criteria if available, otherwise use defaults
  const customCriteria = hackathon.aiScreeningConfig?.criteria;
  const criteriaSection = customCriteria?.length > 0
    ? `ORGANIZER-DEFINED CRITERIA (evaluate strictly against these):\n${customCriteria.map((c, i) => `${i + 1}. ${c.name} (weight: ${c.weight}): ${c.description || ""}`).join("\n")}`
    : `Evaluate based on:\n1. Relevance of skills/experience to the hackathon theme\n2. Quality and thoughtfulness of responses\n3. Motivation and commitment level\n4. Potential to contribute to a team`;

  const langNote = hackathon.aiScreeningConfig?.language === "ar"
    ? "\nNote: Application may be in Arabic. Evaluate content quality regardless of language."
    : hackathon.aiScreeningConfig?.language === "both"
    ? "\nNote: Application may be in Arabic or English. Evaluate content quality regardless of language."
    : "";

  const prompt = `You are an AI screening assistant for hackathon applications. Evaluate this application and provide a score from 0-100.

HACKATHON: "${hackathon.title}"
${hackathon.description ? `DESCRIPTION: ${hackathon.description}` : ""}
${hackathon.tracks?.length ? `TRACKS: ${hackathon.tracks.map(t => t.name).join(", ")}` : ""}

APPLICANT EMAIL: ${userEmail}
APPLICATION RESPONSES:
${JSON.stringify(registration.formResponses || {}, null, 2)}

${criteriaSection}${langNote}

Respond in this exact JSON format ONLY (no markdown, no explanation outside JSON):
{"score": <0-100>, "reasoning": "<2-3 sentence explanation>", "recommendation": "<accept|reject|manual_review>"}`;

  try {
    const result = await gemini.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
        reasoning: parsed.reasoning || "",
        recommendation: parsed.recommendation || "manual_review",
      };
    }

    return { score: 50, reasoning: "Could not parse AI response.", recommendation: "manual_review" };
  } catch (err) {
    console.error("AI screening error:", err.message);
    return { score: 50, reasoning: `AI screening failed: ${err.message}`, recommendation: "manual_review" };
  }
}

/**
 * Evaluate a team's overall readiness.
 */
async function screenTeam({ hackathon, team, members }) {
  const gemini = getModel();
  if (!gemini) {
    return { score: 50, reasoning: "AI screening unavailable.", recommendation: "manual_review" };
  }

  const prompt = `You are evaluating a hackathon team's readiness. Score from 0-100.

HACKATHON: "${hackathon.title}"
TEAM: "${team.name}" (${members.length} members, ${hackathon.settings?.teamSizeMin || 2}-${hackathon.settings?.teamSizeMax || 5} required)
MEMBERS: ${members.map(m => m.userEmail || m.userId).join(", ")}
TRACK: ${team.track || "None specified"}

Evaluate:
1. Team completeness (right number of members)
2. Role diversity potential
3. Track alignment

Respond in JSON ONLY: {"score": <0-100>, "reasoning": "<brief explanation>", "recommendation": "<accept|reject|manual_review>"}`;

  try {
    const result = await gemini.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
        reasoning: parsed.reasoning || "",
        recommendation: parsed.recommendation || "manual_review",
      };
    }
    return { score: 50, reasoning: "Could not parse response.", recommendation: "manual_review" };
  } catch (err) {
    console.error("AI team screening error:", err.message);
    return { score: 50, reasoning: `Failed: ${err.message}`, recommendation: "manual_review" };
  }
}

module.exports = { screenApplication, screenTeam };
