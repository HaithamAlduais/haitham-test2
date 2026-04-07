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
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log(`Firebase Admin initialized for project: ${serviceAccount.project_id}`);
  } catch {
    // In Cloud Functions / production — use Application Default Credentials
    admin.initializeApp();
    console.log('Firebase Admin initialized with default credentials');
  }
}

const app = express();

// ── CORS ────────────────────────────────────────────────────────────────────
// In production: allow only the explicit CORS_ORIGIN(s).
// In development: allow localhost/127.0.0.1 (any port) for Vite and local tools.
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const isLocalDevOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

app.use(cors({
  origin(origin, cb) {
    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) return cb(null, true);
    if (isLocalDevOrigin(origin)) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
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