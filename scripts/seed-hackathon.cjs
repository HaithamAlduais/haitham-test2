/**
 * Ramsha — Hackathon Seed Data Script
 *
 * Seeds the Firestore database with sample hackathon data for development/testing.
 * Uses Firebase Admin SDK with service account credentials.
 *
 * Usage:
 *   node scripts/seed-hackathon.cjs
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account key,
 *           or run from a project with Application Default Credentials.
 */

const path = require("path");

// Load env from server/.env for Firebase credentials
require("dotenv").config({ path: path.join(__dirname, "..", "server", ".env") });

const admin = require("firebase-admin");

// Initialize Firebase Admin (uses GOOGLE_APPLICATION_CREDENTIALS or ADC)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ── Seed Data ────────────────────────────────────────────────────────────────

const DEMO_ORGANIZER_UID = "seed-organizer-001";
const DEMO_JUDGE_UID = "seed-judge-001";
const DEMO_PARTICIPANTS = [
  { uid: "seed-participant-001", name: "Alice Chen", email: "alice@demo.ramsha.com" },
  { uid: "seed-participant-002", name: "Bob Smith", email: "bob@demo.ramsha.com" },
  { uid: "seed-participant-003", name: "Lina Khalid", email: "lina@demo.ramsha.com" },
  { uid: "seed-participant-004", name: "Omar Farouk", email: "omar@demo.ramsha.com" },
  { uid: "seed-participant-005", name: "Sara Nasser", email: "sara@demo.ramsha.com" },
  { uid: "seed-participant-006", name: "Dev Patel", email: "dev@demo.ramsha.com" },
];

async function seed() {
  console.log("🌱 Seeding hackathon data...\n");
  const now = admin.firestore.Timestamp.now();

  // ── 1. Seed demo users ──────────────────────────────────────────────────

  console.log("  → Creating demo users...");
  const usersBatch = db.batch();

  usersBatch.set(db.doc(`users/${DEMO_ORGANIZER_UID}`), {
    email: "organizer@demo.ramsha.com",
    displayName: "Demo Organizer",
    role: "Provider",
    uid: DEMO_ORGANIZER_UID,
    createdAt: now,
  });

  usersBatch.set(db.doc(`users/${DEMO_JUDGE_UID}`), {
    email: "judge@demo.ramsha.com",
    displayName: "Demo Judge",
    role: "Provider",
    uid: DEMO_JUDGE_UID,
    createdAt: now,
  });

  for (const p of DEMO_PARTICIPANTS) {
    usersBatch.set(db.doc(`users/${p.uid}`), {
      email: p.email,
      displayName: p.name,
      role: "Participant",
      uid: p.uid,
      createdAt: now,
    });
  }

  await usersBatch.commit();
  console.log("    ✓ 8 demo users created\n");

  // ── 2. Seed hackathon ───────────────────────────────────────────────────

  console.log("  → Creating demo hackathon...");
  const hackathonRef = db.collection("hackathons").doc();
  const hackathonId = hackathonRef.id;

  const hackathonData = {
    title: "Ramsha AI Innovation Challenge 2026",
    description:
      "Build the future of AI-powered event management. Create innovative solutions that leverage artificial intelligence to transform how people organize, attend, and experience events.",
    tagline: "Hack the future of events",
    slug: `ai-innovation-${hackathonId.slice(0, 6).toLowerCase()}`,
    status: "active",
    organizerId: DEMO_ORGANIZER_UID,
    isPublic: true,

    schedule: {
      registrationOpen: "2026-04-01T00:00",
      registrationClose: "2026-04-14T23:59",
      submissionDeadline: "2026-04-20T23:59",
      judgingStart: "2026-04-21T09:00",
      judgingEnd: "2026-04-23T18:00",
    },

    settings: {
      teamSizeMin: 2,
      teamSizeMax: 5,
      maxRegistrants: 200,
      allowSolo: false,
    },

    tracks: [
      {
        id: "track-ai-assist",
        name: "AI-Powered Assistance",
        description: "Build AI tools that help event organizers automate tasks, generate insights, or enhance attendee experience.",
      },
      {
        id: "track-analytics",
        name: "Smart Analytics",
        description: "Create dashboards and analytics tools that transform raw event data into actionable insights.",
      },
      {
        id: "track-engagement",
        name: "Attendee Engagement",
        description: "Innovate new ways to boost attendee participation, networking, and interaction at events.",
      },
    ],

    prizes: [
      { id: "prize-1st", place: "1st", title: "Grand Prize", value: "10000", description: "Cash prize + mentorship" },
      { id: "prize-2nd", place: "2nd", title: "Runner Up", value: "5000", description: "Cash prize" },
      { id: "prize-3rd", place: "3rd", title: "Third Place", value: "2500", description: "Cash prize" },
      { id: "prize-track", place: "Special", title: "Best Innovation", value: "1000", description: "Per-track award" },
    ],

    judgingCriteria: [
      { id: "crit-innovation", name: "Innovation", weight: 25, maxScore: 10 },
      { id: "crit-technical", name: "Technical Implementation", weight: 25, maxScore: 10 },
      { id: "crit-design", name: "Design & UX", weight: 20, maxScore: 10 },
      { id: "crit-impact", name: "Impact & Feasibility", weight: 20, maxScore: 10 },
      { id: "crit-presentation", name: "Presentation", weight: 10, maxScore: 10 },
    ],

    registrationSettings: {
      requireApproval: false,
      customFields: [],
    },

    branding: {
      logoUrl: "",
      bannerUrl: "",
      primaryColor: "#7C3AED",
      secondaryColor: "#00D4AA",
    },

    rules: "1. All code must be written during the hackathon period.\n2. Teams must use the Ramsha platform for at least one feature.\n3. Submissions must include a demo video (max 3 min).\n4. All team members must be registered participants.\n5. Projects must be open-source (GitHub).",

    registrationCount: 0,
    teamCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await hackathonRef.set(hackathonData);
  console.log(`    ✓ Hackathon created: ${hackathonId}\n`);

  // ── 3. Seed registrations ───────────────────────────────────────────────

  console.log("  → Creating registrations...");
  const regBatch = db.batch();
  let regCount = 0;

  for (const p of DEMO_PARTICIPANTS) {
    const regRef = db.collection("registrations").doc();
    regBatch.set(regRef, {
      hackathonId,
      participantUid: p.uid,
      participantName: p.name,
      participantEmail: p.email,
      status: "approved",
      createdAt: now,
      updatedAt: now,
    });
    regCount++;
  }

  await regBatch.commit();
  console.log(`    ✓ ${regCount} registrations created\n`);

  // ── 4. Seed teams ──────────────────────────────────────────────────────

  console.log("  → Creating teams...");
  const teamsBatch = db.batch();

  const team1Ref = db.collection("teams").doc();
  const team1Id = team1Ref.id;
  teamsBatch.set(team1Ref, {
    hackathonId,
    name: "Neural Navigators",
    trackId: "track-ai-assist",
    captainUid: DEMO_PARTICIPANTS[0].uid,
    memberUids: [DEMO_PARTICIPANTS[0].uid, DEMO_PARTICIPANTS[1].uid, DEMO_PARTICIPANTS[2].uid],
    members: [
      { uid: DEMO_PARTICIPANTS[0].uid, name: DEMO_PARTICIPANTS[0].name, email: DEMO_PARTICIPANTS[0].email, role: "captain" },
      { uid: DEMO_PARTICIPANTS[1].uid, name: DEMO_PARTICIPANTS[1].name, email: DEMO_PARTICIPANTS[1].email, role: "member" },
      { uid: DEMO_PARTICIPANTS[2].uid, name: DEMO_PARTICIPANTS[2].name, email: DEMO_PARTICIPANTS[2].email, role: "member" },
    ],
    createdAt: now,
    updatedAt: now,
  });

  const team2Ref = db.collection("teams").doc();
  const team2Id = team2Ref.id;
  teamsBatch.set(team2Ref, {
    hackathonId,
    name: "Data Dynamos",
    trackId: "track-analytics",
    captainUid: DEMO_PARTICIPANTS[3].uid,
    memberUids: [DEMO_PARTICIPANTS[3].uid, DEMO_PARTICIPANTS[4].uid, DEMO_PARTICIPANTS[5].uid],
    members: [
      { uid: DEMO_PARTICIPANTS[3].uid, name: DEMO_PARTICIPANTS[3].name, email: DEMO_PARTICIPANTS[3].email, role: "captain" },
      { uid: DEMO_PARTICIPANTS[4].uid, name: DEMO_PARTICIPANTS[4].name, email: DEMO_PARTICIPANTS[4].email, role: "member" },
      { uid: DEMO_PARTICIPANTS[5].uid, name: DEMO_PARTICIPANTS[5].name, email: DEMO_PARTICIPANTS[5].email, role: "member" },
    ],
    createdAt: now,
    updatedAt: now,
  });

  await teamsBatch.commit();
  console.log(`    ✓ 2 teams created\n`);

  // ── 5. Seed submissions ─────────────────────────────────────────────────

  console.log("  → Creating submissions...");
  const subBatch = db.batch();

  const sub1Ref = db.collection("submissions").doc();
  const sub1Id = sub1Ref.id;
  subBatch.set(sub1Ref, {
    hackathonId,
    teamId: team1Id,
    teamName: "Neural Navigators",
    trackId: "track-ai-assist",
    title: "EventBot AI",
    description: "An AI-powered chatbot that helps event organizers manage Q&A sessions, automate scheduling, and provide real-time attendee support.",
    demoUrl: "https://demo.example.com/eventbot",
    repoUrl: "https://github.com/demo/eventbot-ai",
    status: "submitted",
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  const sub2Ref = db.collection("submissions").doc();
  const sub2Id = sub2Ref.id;
  subBatch.set(sub2Ref, {
    hackathonId,
    teamId: team2Id,
    teamName: "Data Dynamos",
    trackId: "track-analytics",
    title: "InsightFlow",
    description: "Real-time analytics dashboard that uses ML to predict attendance patterns, identify engagement drops, and suggest improvements mid-event.",
    demoUrl: "https://demo.example.com/insightflow",
    repoUrl: "https://github.com/demo/insightflow",
    status: "submitted",
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await subBatch.commit();
  console.log(`    ✓ 2 submissions created\n`);

  // ── 6. Seed scores ──────────────────────────────────────────────────────

  console.log("  → Creating judge scores...");
  const scoresBatch = db.batch();

  // Judge scores for submission 1
  const criteria = hackathonData.judgingCriteria;
  const scores1 = [9, 8, 7, 8, 9]; // Innovation, Technical, Design, Impact, Presentation
  const scores2 = [7, 9, 8, 7, 7];

  for (let i = 0; i < criteria.length; i++) {
    const s1Ref = db.collection("scores").doc();
    scoresBatch.set(s1Ref, {
      hackathonId,
      submissionId: sub1Id,
      teamId: team1Id,
      judgeUid: DEMO_JUDGE_UID,
      criteriaId: criteria[i].id,
      criteriaName: criteria[i].name,
      score: scores1[i],
      maxScore: criteria[i].maxScore,
      comment: "",
      createdAt: now,
    });

    const s2Ref = db.collection("scores").doc();
    scoresBatch.set(s2Ref, {
      hackathonId,
      submissionId: sub2Id,
      teamId: team2Id,
      judgeUid: DEMO_JUDGE_UID,
      criteriaId: criteria[i].id,
      criteriaName: criteria[i].name,
      score: scores2[i],
      maxScore: criteria[i].maxScore,
      comment: "",
      createdAt: now,
    });
  }

  await scoresBatch.commit();
  console.log(`    ✓ 10 scores created (5 per submission)\n`);

  // ── 7. Update counts ───────────────────────────────────────────────────

  await hackathonRef.update({
    registrationCount: DEMO_PARTICIPANTS.length,
    teamCount: 2,
  });

  console.log("  → Updated hackathon counts\n");

  // ── Summary ─────────────────────────────────────────────────────────────

  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ Seed data complete!");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Hackathon ID : ${hackathonId}`);
  console.log(`  Slug         : ${hackathonData.slug}`);
  console.log(`  Users        : 8 (1 organizer, 1 judge, 6 participants)`);
  console.log(`  Registrations: ${regCount}`);
  console.log(`  Teams        : 2 (Neural Navigators, Data Dynamos)`);
  console.log(`  Submissions  : 2 (EventBot AI, InsightFlow)`);
  console.log(`  Scores       : 10 (5 criteria × 2 submissions)`);
  console.log("═══════════════════════════════════════════════════════\n");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
