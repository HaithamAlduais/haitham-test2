require('dotenv').config(); // Load server/.env
require('dotenv').config({ path: require('path').join(__dirname, '../.env') }); // Load root ../.env for R2 keys
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// ── Initialize Firebase Admin SDK ───────────────────────────────────────────
const path = require('path');
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.join(__dirname, 'serviceAccountKey.json');

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (err) {
  console.error(
    `FATAL: Could not load service account key from "${serviceAccountPath}". ` +
    `Ensure the file exists. Error: ${err.message}`
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log(`Firebase Admin initialized for project: ${serviceAccount.project_id}`);

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
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/participant', participantRoutes);
app.use('/api/export', exportRoutes);

// A simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: "Hello from your Express backend!" });
});

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
  });
}