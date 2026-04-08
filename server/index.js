require('dotenv').config(); // Load server/.env
require('dotenv').config({ path: require('path').join(__dirname, '../.env') }); // Load root ../.env for R2 keys
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// ── Initialize Firebase Admin SDK ───────────────────────────────────────────
const path = require('path');

if (!admin.apps.length) {
  try {
    // Try loading service account key (local dev)
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
      || path.join(__dirname, 'serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
    });
    console.log(`Firebase Admin initialized for project: ${serviceAccount.project_id}`);
  } catch {
    // In Cloud Functions / production — use Application Default Credentials
    admin.initializeApp({
      storageBucket: 'ramsha-cd619.firebasestorage.app',
    });
    console.log('Firebase Admin initialized with default credentials');
  }
}

const app = express();

// ── CORS ────────────────────────────────────────────────────────────────────
// In production: allow only the explicit CORS_ORIGIN(s).
// In development: allow localhost/127.0.0.1 (any port) for Vite and local tools.
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [];

// Always allow these origins (Firebase Hosting domains + localhost)
const ALWAYS_ALLOWED = [
  'https://ramsha.net',
  'https://www.ramsha.net',
  'https://ramsha-cd619.web.app',
  'https://ramsha-cd619.firebaseapp.com',
];

app.use(cors({
  origin(origin, cb) {
    // Allow requests with no origin (same-origin via hosting rewrite, server-to-server, curl)
    if (!origin) return cb(null, true);
    // Always allow our Firebase domains
    if (ALWAYS_ALLOWED.includes(origin)) return cb(null, true);
    // Allow configured origins
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Allow localhost in development
    try {
      const { hostname } = new URL(origin);
      if (hostname === 'localhost' || hostname === '127.0.0.1') return cb(null, true);
    } catch {}
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
const sessionRoutes = require('./routes/sessions');
const attendanceRoutes = require('./routes/attendance');
const eventRoutes = require('./routes/events');
const hackathonRoutes = require('./routes/hackathons');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const participantRoutes = require('./routes/participant');
const exportRoutes = require('./routes/export');
const sponsorPortalRoutes = require('./routes/sponsorPortal');
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/participant', participantRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/sponsor', sponsorPortalRoutes);
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

// ── AI File Extract → Auto-fill Wizard ─────────────────────────────────────
const Busboy = require('busboy');

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 20 * 1024 * 1024 } });
    const files = [];

    busboy.on('file', (fieldname, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end', () => {
        files.push({ fieldname, filename, mimeType, buffer: Buffer.concat(chunks) });
      });
    });

    busboy.on('finish', () => resolve(files));
    busboy.on('error', reject);

    // In Cloud Functions, the body is already buffered as rawBody
    if (req.rawBody) {
      busboy.end(req.rawBody);
    } else {
      req.pipe(busboy);
    }
  });
}

app.post('/api/ai/extract-from-file', require('./middleware/requireRole')('Organizer', 'Admin'), async (req, res) => {
  try {
    // Parse multipart form (works in both local and Cloud Functions)
    const files = await parseMultipart(req);
    const uploaded = files[0];

    console.log("[extract-from-file] Starting...", uploaded?.filename, uploaded?.mimeType, uploaded?.buffer?.length);

    if (!uploaded || !uploaded.buffer) return res.status(400).json({ error: "No file uploaded" });

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key not configured" });

    // Upload file to Firebase Storage first
    let fileUrl = null;
    try {
      const bucket = admin.storage().bucket();
      const fileName = `hackathon-files/${req.uid}/${Date.now()}_${uploaded.filename}`;
      const gcsFile = bucket.file(fileName);
      await gcsFile.save(uploaded.buffer, { contentType: uploaded.mimeType });
      const [url] = await gcsFile.getSignedUrl({ action: 'read', expires: '2030-01-01' });
      fileUrl = url;
      console.log("[extract-from-file] File uploaded to storage:", fileName);
    } catch (uploadErr) {
      console.warn("[extract-from-file] Storage upload failed:", uploadErr.message);
    }

    // Send file directly to Gemini as inline data
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const fileBase64 = uploaded.buffer.toString('base64');
    const mimeType = uploaded.mimeType || 'application/octet-stream';

    const prompt = `You are an AI assistant. Read this uploaded file and extract hackathon information. Return it as a JSON object.

Return ONLY a valid JSON object with these fields (use empty string "" if not found, empty array [] for arrays):
{
  "title": "hackathon title",
  "description": "full description",
  "targetAudience": "who should participate",
  "format": "online" or "in-person",
  "contactEmail": "contact email",
  "rules": "rules and code of conduct",
  "location": { "name": "venue name", "address": "address" },
  "schedule": {
    "registrationOpen": "ISO datetime or empty",
    "registrationClose": "ISO datetime or empty",
    "hackathonStart": "ISO datetime or empty",
    "hackathonEnd": "ISO datetime or empty",
    "judgingStart": "ISO datetime or empty",
    "judgingEnd": "ISO datetime or empty"
  },
  "tracks": [{ "name": "track name", "description": "description" }],
  "prizes": [{ "place": "1st", "title": "Grand Prize", "value": "$5000", "category": "overall", "type": "cash" }],
  "sponsors": [{ "name": "Sponsor", "tier": "gold" }],
  "faq": [{ "question": "Q?", "answer": "A" }]
}`;

    console.log("[extract-from-file] Sending to Gemini...", mimeType, fileBase64.length, "bytes base64");

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: fileBase64 } },
    ]);
    const text = result.response.text();
    console.log("[extract-from-file] Gemini response length:", text.length);
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.json({ wizardData: null, fileUrl, error: "Could not parse AI response" });
    }

    const wizardData = JSON.parse(jsonMatch[0]);
    return res.json({ wizardData, fileUrl });
  } catch (err) {
    console.error("Extract from file error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── AI Wizard Suggest ──────────────────────────────────────────────────────
app.post('/api/ai/wizard-suggest', require('./middleware/requireRole')('Organizer', 'Admin'), async (req, res) => {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key not configured" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const { targetStep, currentData } = req.body;
    if (!targetStep) return res.status(400).json({ error: "targetStep required" });

    const context = `You are an AI assistant helping create a hackathon. Here's what the organizer entered:
Title: ${currentData?.title || "Not set"}
Tagline: ${currentData?.tagline || "Not set"}
Description: ${currentData?.description || "Not set"}
Format: ${currentData?.format || "online"}
Target Audience: ${currentData?.targetAudience || "Not set"}
${currentData?.tracks?.length ? `Tracks: ${currentData.tracks.map(t => t.name).join(", ")}` : "No tracks yet"}
${currentData?.schedule?.registrationOpen ? `Reg opens: ${currentData.schedule.registrationOpen}` : ""}
Rules: ${currentData?.rules || "Not set"}`;

    const prompts = {
      schedule: `${context}\n\nSuggest realistic dates starting 2-4 weeks from now for a hackathon. Return ONLY valid JSON:\n{"registrationOpen":"2026-05-01T00:00","registrationClose":"2026-05-14T23:59","submissionDeadline":"2026-05-20T23:59","judgingStart":"2026-05-21T09:00","judgingEnd":"2026-05-23T18:00"}`,
      tracks: `${context}\n\nSuggest 3 relevant tracks for this hackathon. Return ONLY a JSON array:\n[{"name":"Track Name","description":"Brief description of the track"}]`,
      judging: `${context}\n\nSuggest 5 judging criteria with weights totaling exactly 100. Return ONLY a JSON array:\n[{"name":"Innovation","weight":25,"maxScore":5}]`,
      prizes: `${context}\n\nSuggest prizes. Return ONLY a JSON array:\n[{"place":"1st","title":"Grand Prize","value":"$5,000","category":"overall","type":"cash"}]`,
      faq: `${context}\n\nSuggest 5 FAQ entries. Return ONLY a JSON array:\n[{"question":"Who can participate?","answer":"Anyone 18+ with a passion for building."}]`,
      resources: `${context}\n\nSuggest 3 resources for participants. Return ONLY a JSON array:\n[{"title":"Starter Template","type":"template","url":"https://github.com/example","autoSendOnAccept":true}]`,
    };

    const prompt = prompts[targetStep];
    if (!prompt) return res.status(400).json({ error: `Unknown step: ${targetStep}` });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
    if (!jsonMatch) return res.json({ suggestion: null, raw: text });

    const suggestion = JSON.parse(jsonMatch[0]);
    return res.json({ suggestion });
  } catch (err) {
    console.error("AI wizard suggest error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Generate full landing page HTML
app.post('/api/ai/generate-landing-page', require('./middleware/requireRole')('Organizer', 'Admin'), async (req, res) => {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key not configured" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const { wizardData } = req.body;

    const prompt = `Create a complete, beautiful, single-page HTML landing page for this hackathon. Include embedded CSS and minimal JavaScript. Make it visually stunning, responsive, and professional.

HACKATHON DATA:
Title: ${wizardData?.title || "Hackathon"}
Description: ${wizardData?.description || ""}
Tagline: ${wizardData?.tagline || ""}
Target Audience: ${wizardData?.targetAudience || "Everyone"}
Format: ${wizardData?.format || "online"}
Contact: ${wizardData?.contactEmail || ""}
Tracks: ${(wizardData?.tracks || []).map(t => `${t.name}: ${t.description || ""}`).join("; ") || "None"}
Prizes: ${(wizardData?.prizes || []).map(p => `${p.place || ""} ${p.title}: ${p.value || ""}`).join("; ") || "None"}
Schedule: Reg: ${wizardData?.schedule?.registrationOpen || "TBD"} - ${wizardData?.schedule?.registrationClose || "TBD"}, Submission: ${wizardData?.schedule?.submissionDeadline || "TBD"}, Judging: ${wizardData?.schedule?.judgingStart || "TBD"} - ${wizardData?.schedule?.judgingEnd || "TBD"}
Judging Criteria: ${(wizardData?.judgingCriteria || []).map(c => `${c.name} (${c.weight}%)`).join(", ") || "None"}
Sponsors: ${(wizardData?.sponsors || []).map(s => `${s.name} (${s.tier})`).join(", ") || "None"}
Rules: ${wizardData?.rules || ""}
FAQ: ${(wizardData?.faq || []).map(f => `Q: ${f.question} A: ${f.answer}`).join("; ") || "None"}
Primary Color: ${wizardData?.branding?.primaryColor || "#7C3AED"}
Secondary Color: ${wizardData?.branding?.secondaryColor || "#00D4AA"}

REQUIREMENTS:
- Complete self-contained HTML with embedded CSS
- Sections: Hero with title+tagline+CTA, About, Tracks, Prizes, Schedule, Judging Criteria, Sponsors, FAQ, Register CTA, Footer with contact
- Use the branding colors
- Responsive design
- Smooth scroll navigation
- Arabic-friendly (use dir="rtl" if content is Arabic)
- Google Fonts via CDN
- Return ONLY raw HTML starting with <!DOCTYPE html>`;

    const result = await model.generateContent(prompt);
    let html = result.response.text();
    html = html.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();

    res.json({ html });
  } catch (err) {
    console.error("Generate landing page error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Improve existing landing page with instructions
app.post('/api/ai/improve-landing-page', require('./middleware/requireRole')('Organizer', 'Admin'), async (req, res) => {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key not configured" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const { currentHtml, instruction } = req.body;

    const prompt = `Modify this HTML landing page based on the instruction. Return ONLY the complete modified HTML, no explanations.

CURRENT HTML:
${(currentHtml || "").substring(0, 20000)}

INSTRUCTION: ${instruction}

Return ONLY raw HTML starting with <!DOCTYPE html>.`;

    const result = await model.generateContent(prompt);
    let html = result.response.text();
    html = html.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();

    res.json({ html });
  } catch (err) {
    console.error("Improve landing page error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Test routes (admin only) ───────────────────────────────────────────────
app.get('/api/test', (req, res) => {
  res.json({
    message: "Hello from your Express backend!",
    env: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "SET (" + process.env.GEMINI_API_KEY.substring(0,10) + "...)" : "NOT SET",
      RESEND_API_KEY: process.env.RESEND_API_KEY ? "SET" : "NOT SET",
      DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN ? "SET" : "NOT SET",
    }
  });
});

// Test email sending
app.post('/api/test-email', require('./middleware/requireRole')('Admin', 'Organizer'), async (req, res) => {
  try {
    const { sendTemplatedEmail } = require('./services/emailService');
    const result = await sendTemplatedEmail('registration_confirmation', {
      to: req.body.to || req.email,
      data: { participantName: 'Test User', hackathonTitle: 'AI Builders 2026', hackathonUrl: 'https://ramsha.net/hackathon/ai-builders-2026' },
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test Gemini AI
app.post('/api/test-gemini', require('./middleware/requireRole')('Admin', 'Organizer'), async (req, res) => {
  try {
    const { screenApplication } = require('./services/aiScreening');
    const result = await screenApplication({
      hackathon: { title: 'AI Builders 2026', description: 'Build AI tools', tracks: [{ name: 'AI Dev Tools' }] },
      registration: { formResponses: { motivation: req.body.prompt || 'Test application' } },
      userEmail: 'test@example.com',
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Discord Bot ────────────────────────────────────────────────────────────
const { initDiscordBot } = require('./services/discordService');

// ── Scheduled Jobs ──────────────────────────────────────────────────────────
const { startAutoCloseJob } = require('./jobs/autoClose');

// Export the app for Firebase Cloud Functions
module.exports = app;

// Start the server only when run directly (not imported by Cloud Functions)
if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
    startAutoCloseJob();
    initDiscordBot();
  });
}