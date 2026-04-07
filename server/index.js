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

// ── AI Wizard Suggest ──────────────────────────────────────────────────────
app.post('/api/ai/wizard-suggest', require('./middleware/requireRole')('Organizer', 'Admin'), async (req, res) => {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key not configured" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

// ── Test routes (admin only) ───────────────────────────────────────────────
app.get('/api/test', (req, res) => {
  res.json({ message: "Hello from your Express backend!" });
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