const { admin, db } = require("../lib/firebase");

// Lazy collection accessor
const eventsCol = () => db().collection("events");

function randomCodeSegment(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let index = 0; index < length; index += 1) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

async function generateHackathonEventCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `HCK-${randomCodeSegment(6)}`;
    const existing = await eventsCol().where("eventCode", "==", candidate).limit(1).get();
    if (existing.empty) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique event code.");
}

// ── Helper: slug from name ───────────────────────────────────────────────────

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── POST /api/events/hackathon ───────────────────────────────────────────────

/**
 * Ramsha — Create a hackathon event with a generated landing page.
 *
 * Saves full hackathon data + generated HTML to Firestore.
 * Slug auto-increments on conflict (appends -2, -3, etc.).
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function createHackathonEvent(req, res) {
  try {
    const { name, generatedHtml, hackathonData, visibility } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "name is required." });
    }

    const isPrivate = visibility === "private";

    if (!isPrivate && (!generatedHtml || typeof generatedHtml !== "string")) {
      return res.status(400).json({ error: "generatedHtml is required for public hackathons." });
    }

    // Generate unique slug — append -2, -3, etc. on conflict
    let slug = toSlug(name.trim());
    let finalSlug = slug;
    let suffix = 1;
    while (true) {
      const existing = await eventsCol().where("slug", "==", finalSlug).limit(1).get();
      if (existing.empty) break;
      suffix++;
      finalSlug = `${slug}-${suffix}`;
    }

    const eventCode = await generateHackathonEventCode();

    const eventData = {
      ownerUid: req.uid,
      name: name.trim(),
      slug: finalSlug,
      eventCode,
      eventType: "hackathon",
      visibility: isPrivate ? "private" : "public",
      description: hackathonData?.description || "",
      hackathonData: hackathonData || {},
      ...(generatedHtml ? { generatedHtml } : {}),
      ...(isPrivate ? {} : { publishedAt: admin.firestore.FieldValue.serverTimestamp() }),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await eventsCol().add(eventData);

    return res.status(201).json({
      id: docRef.id,
      slug: finalSlug,
      eventCode,
      name: eventData.name,
      visibility: eventData.visibility,
      url: `/events/p/${finalSlug}`,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("createHackathonEvent error:", err);
    return res.status(500).json({ error: "Failed to create hackathon event." });
  }
}

// ── GET /api/events/page/:slug ───────────────────────────────────────────────

/**
 * Ramsha — Serve a public event landing page by slug.
 * No authentication required.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function getPublicEventPage(req, res) {
  try {
    const { slug } = req.params;
    const snapshot = await eventsCol().where("slug", "==", slug).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Event page not found." });
    }

    const event = snapshot.docs[0].data();
    if (!event.generatedHtml) {
      return res.status(404).json({ error: "No generated page for this event." });
    }

    return res.json({ slug: event.slug, name: event.name, html: event.generatedHtml });
  } catch (err) {
    console.error("getPublicEventPage error:", err);
    return res.status(500).json({ error: "Failed to load event page." });
  }
}

module.exports = {
  createHackathonEvent,
  getPublicEventPage,
};
