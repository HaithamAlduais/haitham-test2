const Anthropic = require("@anthropic-ai/sdk");

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn("ANTHROPIC_API_KEY not set — AI screening will be skipped.");
      return null;
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

/**
 * Evaluate a registration application using Claude.
 *
 * @param {object} params
 * @param {object} params.hackathon - Hackathon data (title, description, tracks, criteria)
 * @param {object} params.registration - Registration form responses
 * @param {string} params.userEmail - Applicant email
 * @returns {Promise<{score: number, reasoning: string, recommendation: string}>}
 */
async function screenApplication({ hackathon, registration, userEmail }) {
  const anthropic = getClient();
  if (!anthropic) {
    return { score: 50, reasoning: "AI screening unavailable (API key not configured).", recommendation: "manual_review" };
  }

  const prompt = `You are an AI screening assistant for hackathon applications. Evaluate this application and provide a score from 0-100.

HACKATHON: "${hackathon.title}"
${hackathon.description ? `DESCRIPTION: ${hackathon.description}` : ""}
${hackathon.tracks?.length ? `TRACKS: ${hackathon.tracks.map(t => t.name).join(", ")}` : ""}

APPLICANT EMAIL: ${userEmail}
APPLICATION RESPONSES:
${JSON.stringify(registration.formResponses || {}, null, 2)}

Evaluate based on:
1. Relevance of skills/experience to the hackathon theme
2. Quality and thoughtfulness of responses
3. Motivation and commitment level
4. Potential to contribute to a team

Respond in this exact JSON format:
{"score": <0-100>, "reasoning": "<2-3 sentence explanation>", "recommendation": "<accept|reject|manual_review>"}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, Number(result.score) || 50)),
        reasoning: result.reasoning || "",
        recommendation: result.recommendation || "manual_review",
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
  const anthropic = getClient();
  if (!anthropic) {
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

Respond in JSON: {"score": <0-100>, "reasoning": "<brief explanation>", "recommendation": "<accept|reject|manual_review>"}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, Number(result.score) || 50)),
        reasoning: result.reasoning || "",
        recommendation: result.recommendation || "manual_review",
      };
    }
    return { score: 50, reasoning: "Could not parse response.", recommendation: "manual_review" };
  } catch (err) {
    console.error("AI team screening error:", err.message);
    return { score: 50, reasoning: `Failed: ${err.message}`, recommendation: "manual_review" };
  }
}

module.exports = { screenApplication, screenTeam };
