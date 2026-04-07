/**
 * Ramsha — Wizard AI Service
 *
 * Uses the BACKEND Gemini API for reliable AI suggestions.
 * Calls POST /api/ai/wizard-suggest which runs Gemini server-side.
 */

import { apiPost } from "@/utils/apiClient";

/**
 * Given current wizard data, suggest content for the next step.
 * @param {string} targetStep - schedule, tracks, judging, prizes, faq, resources
 * @param {object} currentData - all data collected so far
 * @returns {object|null} suggested fields
 */
export async function suggestForStep(targetStep, currentData) {
  try {
    const result = await apiPost("/api/ai/wizard-suggest", {
      targetStep,
      currentData: {
        title: currentData.title || "",
        tagline: currentData.tagline || "",
        description: currentData.description || "",
        format: currentData.format || "online",
        targetAudience: currentData.targetAudience || "",
        whyParticipate: currentData.whyParticipate || "",
        tracks: currentData.tracks || [],
        schedule: currentData.schedule || {},
        prizes: currentData.prizes || [],
        rules: currentData.rules || "",
      },
    });
    return result.suggestion;
  } catch (err) {
    console.warn("[AI Suggest] Failed:", err.message);
    return null;
  }
}
