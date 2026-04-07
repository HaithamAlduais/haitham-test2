/**
 * Ramsha — Comprehensive Test Data Seeder
 *
 * Creates Firebase Auth accounts + Firestore documents for testing
 * the complete hackathon lifecycle.
 *
 * Usage: node scripts/seed-test-data.cjs
 */

const path = require("path");

// Resolve modules from server/node_modules
const serverDir = path.join(__dirname, "..", "server");
module.paths.unshift(path.join(serverDir, "node_modules"));

require("dotenv").config({ path: path.join(serverDir, ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const admin = require("firebase-admin");

if (!admin.apps.length) {
  const svcPath = path.join(serverDir, "serviceAccountKey.json");
  admin.initializeApp({ credential: admin.credential.cert(require(svcPath)) });
}

const db = admin.firestore();
const auth = admin.auth();

// ── Test Users ─────────────────────────────────────────────────────────────

const ADMIN_USER = {
  email: "alduaishaitham@gmail.com",
  password: "112233",
  displayName: "Haitham (Admin)",
  role: "Admin",
};

const TEST_ORGANIZER = {
  email: "organizer@test.ramsha.net",
  password: "Test@2026",
  displayName: "Sarah Al-Rashid",
  role: "Organizer",
  bio: "Event organizer with 5+ years in tech community building in Riyadh.",
  phone: "+966501234567",
  location: "Riyadh, Saudi Arabia",
  skills: ["Event Management", "Community Building", "Marketing"],
  professional: { title: "Community Manager", company: "TechHub Riyadh" },
  social: { linkedin: "sarah-alrashid", twitter: "sarahrashid_ksa" },
};

const TEST_JUDGE = {
  email: "judge@test.ramsha.net",
  password: "Test@2026",
  displayName: "Dr. Ahmed Nasser",
  role: "Judge",
  bio: "AI researcher and CTO. Judge at 20+ hackathons globally.",
  skills: ["AI/ML", "Cloud Architecture", "Product Strategy"],
  professional: { title: "CTO", company: "NovaTech AI" },
};

const TEST_SPONSOR = {
  email: "sponsor@test.ramsha.net",
  password: "Test@2026",
  displayName: "Reem Al-Faisal (STC)",
  role: "Sponsor",
  bio: "Innovation partnerships lead at STC. Connecting startups with enterprise.",
  professional: { title: "Innovation Lead", company: "STC" },
};

const TEST_PARTICIPANTS = [
  {
    email: "lina@test.ramsha.net", password: "Test@2026",
    displayName: "Lina Khalid", role: "Participant",
    bio: "Full-stack developer passionate about AI tools.",
    skills: ["JavaScript", "React", "Python", "Firebase", "Figma"],
    education: { institution: "King Saud University", degree: "BSc", field: "Computer Science", year: "2025" },
    professional: { title: "Software Engineer", company: "Freelance" },
    social: { github: "linakhalid", linkedin: "lina-khalid-dev" },
  },
  {
    email: "omar@test.ramsha.net", password: "Test@2026",
    displayName: "Omar Farouk", role: "Participant",
    bio: "UI/UX designer turning ideas into beautiful interfaces.",
    skills: ["Figma", "UI/UX Design", "Adobe XD", "React", "Tailwind CSS"],
    education: { institution: "Effat University", degree: "BSc", field: "Design", year: "2024" },
    professional: { title: "UI/UX Designer", company: "DesignCo" },
    social: { github: "omarfarouk-design", linkedin: "omar-farouk-ux" },
  },
  {
    email: "noura@test.ramsha.net", password: "Test@2026",
    displayName: "Noura Al-Saud", role: "Participant",
    bio: "Product manager who loves building MVPs in hackathons.",
    skills: ["Product Management", "Figma", "SQL", "Python", "Leadership"],
    education: { institution: "Princess Nourah University", degree: "MBA", field: "Business", year: "2023" },
    professional: { title: "Product Manager", company: "SaaS Startup" },
    social: { linkedin: "noura-alsaud-pm" },
  },
  {
    email: "faisal@test.ramsha.net", password: "Test@2026",
    displayName: "Faisal Al-Harbi", role: "Participant",
    bio: "ML engineer obsessed with LLMs and agentic AI.",
    skills: ["Python", "TypeScript", "TensorFlow", "Claude API", "Firebase"],
    education: { institution: "KAUST", degree: "MSc", field: "Machine Learning", year: "2024" },
    professional: { title: "ML Engineer", company: "AI Lab" },
    social: { github: "faisal-ml", linkedin: "faisal-alharbi-ml" },
  },
  {
    email: "dana@test.ramsha.net", password: "Test@2026",
    displayName: "Dana Mousa", role: "Participant",
    bio: "Backend developer with a love for clean architecture.",
    skills: ["Node.js", "PostgreSQL", "Go", "Docker", "Firebase"],
    education: { institution: "KFUPM", degree: "BSc", field: "Software Engineering", year: "2025" },
    professional: { title: "Backend Developer", company: "CloudKSA" },
    social: { github: "danamousa" },
  },
  {
    email: "youssef@test.ramsha.net", password: "Test@2026",
    displayName: "Youssef Ibrahim", role: "Participant",
    bio: "Frontend dev and hackathon veteran. 8 hackathons, 3 wins.",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Supabase"],
    education: { institution: "Cairo University", degree: "BSc", field: "CS", year: "2023" },
    professional: { title: "Senior Frontend Dev", company: "RemoteTech" },
    social: { github: "youssefibrahim", linkedin: "youssef-ibrahim-dev" },
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

async function createOrGetUser(userData) {
  let uid;
  try {
    const existing = await auth.getUserByEmail(userData.email);
    uid = existing.uid;
    console.log(`    ✓ Found existing: ${userData.email} (${uid})`);
  } catch {
    const created = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      emailVerified: true,
    });
    uid = created.uid;
    console.log(`    ✓ Created: ${userData.email} (${uid})`);
  }

  // Write Firestore profile
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db.doc(`users/${uid}`).set({
    email: userData.email,
    displayName: userData.displayName,
    role: userData.role,
    roles: [userData.role],
    uid,
    bio: userData.bio || "",
    phone: userData.phone || "",
    location: userData.location || "",
    skills: userData.skills || [],
    interests: [],
    education: userData.education || {},
    professional: userData.professional || {},
    social: userData.social || {},
    profileCompleteness: userData.skills?.length > 0 ? 75 : 30,
    profileVisibility: "public",
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  return uid;
}

// ── Main Seed ──────────────────────────────────────────────────────────────

async function seed() {
  console.log("\n🌱 ═══════════════════════════════════════════════════════");
  console.log("   Ramsha — Comprehensive Test Data Seeder");
  console.log("═══════════════════════════════════════════════════════\n");

  // 1. Create users
  console.log("📋 Creating users...");
  const adminUid = await createOrGetUser(ADMIN_USER);
  const organizerUid = await createOrGetUser(TEST_ORGANIZER);
  const judgeUid = await createOrGetUser(TEST_JUDGE);
  const sponsorUid = await createOrGetUser(TEST_SPONSOR);

  const participantUids = [];
  for (const p of TEST_PARTICIPANTS) {
    const uid = await createOrGetUser(p);
    participantUids.push(uid);
  }
  console.log(`\n    Total users: ${4 + participantUids.length}\n`);

  // 2. Create a realistic hackathon
  console.log("🏆 Creating hackathon...");
  const now = admin.firestore.FieldValue.serverTimestamp();
  const hackathonId = "test-hackathon-2026";

  const hackathonData = {
    organizerId: organizerUid,
    ownerUid: organizerUid,
    title: "Ramsha AI Builders Challenge 2026",
    name: "Ramsha AI Builders Challenge 2026",
    tagline: "Build the future of AI-powered productivity",
    description: "A 48-hour hackathon bringing together developers, designers, and product managers to build AI-powered tools that solve real problems. Open to all skill levels. $15,000+ in prizes.",
    slug: "ai-builders-2026",
    format: "hybrid",
    eventType: "hackathon",
    status: "active",
    isPublic: true,
    visibility: "public",
    branding: {
      logoUrl: "",
      bannerUrl: "",
      primaryColor: "#7C3AED",
      secondaryColor: "#00D4AA",
      hashtag: "#RamshaAIBuilders",
    },
    settings: {
      maxRegistrants: 200,
      teamSizeMin: 3,
      teamSizeMax: 5,
      allowSolo: false,
      roleSlots: { pm: { min: 1, max: 1 }, developer: { min: 1, max: 2 }, designer: { min: 1, max: 2 } },
    },
    schedule: {
      registrationOpen: "2026-04-01T00:00",
      registrationClose: "2026-04-15T23:59",
      submissionDeadline: "2026-04-25T23:59",
      judgingStart: "2026-04-26T09:00",
      judgingEnd: "2026-04-28T18:00",
    },
    tracks: [
      { id: "track-ai-tools", name: "AI Developer Tools", description: "Build tools that help developers code faster with AI." },
      { id: "track-ai-business", name: "AI for Business", description: "AI solutions for real business problems in MENA region." },
      { id: "track-ai-creative", name: "AI Creative Tools", description: "AI-powered tools for designers, writers, and creators." },
    ],
    judgingCriteria: [
      { id: "crit-innovation", name: "Innovation", weight: 25, maxScore: 5 },
      { id: "crit-technical", name: "Technical Quality", weight: 25, maxScore: 5 },
      { id: "crit-design", name: "Design & UX", weight: 20, maxScore: 5 },
      { id: "crit-impact", name: "Impact & Feasibility", weight: 20, maxScore: 5 },
      { id: "crit-pitch", name: "Pitch & Presentation", weight: 10, maxScore: 5 },
    ],
    prizes: [
      { id: "p1", category: "overall", place: "1st", title: "Grand Prize", value: "$5,000", type: "cash", fulfillment: "pending", awardedTo: null },
      { id: "p2", category: "overall", place: "2nd", title: "Runner Up", value: "$3,000", type: "cash", fulfillment: "pending", awardedTo: null },
      { id: "p3", category: "overall", place: "3rd", title: "Third Place", value: "$1,500", type: "cash", fulfillment: "pending", awardedTo: null },
      { id: "p4", category: "per_track", place: "Best", title: "Best AI Dev Tool", value: "$1,000", type: "cash", trackId: "track-ai-tools", fulfillment: "pending", awardedTo: null },
      { id: "p5", category: "special", place: "Special", title: "Most Innovative", value: "Mentorship + Credits", type: "access", fulfillment: "pending", awardedTo: null },
      { id: "p6", category: "popular_choice", place: "Popular", title: "Community Favorite", value: "$500", type: "cash", fulfillment: "pending", awardedTo: null },
      { id: "p7", category: "sponsor", place: "Sponsor", title: "Best Use of STC API", value: "$2,000", type: "cash", sponsorName: "STC", fulfillment: "pending", awardedTo: null },
    ],
    rules: "1. All code must be written during the hackathon (Apr 20-25).\n2. Teams of 3-5 members required.\n3. Each team needs: 1 PM, 1-2 Developers, 1-2 Designers.\n4. Must submit: GitHub repo, demo video (3 min max), pitch deck.\n5. All submissions must be open source.\n6. Use of AI coding tools (Cursor, Copilot, etc.) is encouraged.\n7. Plagiarism = immediate disqualification.",
    sponsors: [
      { id: "s1", name: "STC", tier: "gold", logoUrl: "", websiteUrl: "https://stc.com.sa", description: "Leading telecom in Saudi Arabia" },
      { id: "s2", name: "SDAIA", tier: "gold", logoUrl: "", websiteUrl: "https://sdaia.gov.sa", description: "Saudi Data & AI Authority" },
      { id: "s3", name: "Elm", tier: "silver", logoUrl: "", websiteUrl: "https://elm.sa", description: "Digital solutions company" },
    ],
    resources: [
      { id: "r1", title: "Starter Template (React + Firebase)", type: "template", url: "https://github.com/ramsha/starter", autoSendOnAccept: true },
      { id: "r2", title: "AI API Credits ($100)", type: "credits", url: "https://ramsha.net/credits", autoSendOnAccept: true },
      { id: "r3", title: "Design System & UI Kit", type: "guide", url: "https://figma.com/ramsha-kit", autoSendOnAccept: true },
      { id: "r4", title: "Sample Datasets (Arabic NLP)", type: "dataset", url: "https://huggingface.co/arabic-nlp", autoSendOnAccept: false },
    ],
    faq: [
      { question: "Who can participate?", answer: "Anyone 18+ with a passion for building. No prior hackathon experience required." },
      { question: "Do I need a team to register?", answer: "No! Register first, then form or join a team. We'll help match you." },
      { question: "Can I use AI coding tools?", answer: "Yes! Cursor, Copilot, Claude, ChatGPT — all encouraged. This is an AI hackathon!" },
      { question: "Is it free?", answer: "Completely free. Food, internet, and workspace provided for in-person participants." },
      { question: "What if I'm a beginner?", answer: "Welcome! We have workshops, mentors, and starter kits to help you get started." },
    ],
    aiScreeningConfig: { enabled: true, criteria: [{ name: "Technical Skills", weight: 40, description: "Relevant programming and AI skills" }, { name: "Motivation", weight: 30, description: "Clear motivation and commitment" }, { name: "Team Fit", weight: 30, description: "Ability to contribute to a team" }], autoAcceptThreshold: 75, autoRejectThreshold: 25, language: "both" },
    enablePopularVote: true,
    workbackSchedule: [],
    registrationSettings: { requireApproval: true, customFields: [{ id: "cf1", label: "Which track interests you most?", type: "select", required: true, options: ["AI Developer Tools", "AI for Business", "AI Creative Tools"] }] },
    registrationCount: 6,
    teamCount: 2,
    createdAt: now,
    updatedAt: now,
  };

  // Write to both collections
  await db.doc(`hackathons/${hackathonId}`).set(hackathonData);
  await db.doc(`events/${hackathonId}`).set(hackathonData);
  console.log(`    ✓ Hackathon: ${hackathonId} (${hackathonData.title})\n`);

  // 3. Create registrations
  console.log("📝 Creating registrations...");
  const regBatch = db.batch();
  const regStatuses = ["accepted", "accepted", "accepted", "accepted", "accepted", "pending"];

  for (let i = 0; i < TEST_PARTICIPANTS.length; i++) {
    const p = TEST_PARTICIPANTS[i];
    const regRef = db.collection(`events/${hackathonId}/registrations`).doc(`reg-${i}`);
    regBatch.set(regRef, {
      userId: participantUids[i],
      userEmail: p.email,
      hackathonId,
      formResponses: {
        email: p.email,
        motivation: `I want to build something amazing with AI. I have experience in ${(p.skills || []).slice(0, 3).join(", ")} and I'm excited about this hackathon!`,
        experienceLevel: i < 3 ? "Intermediate" : "Advanced",
        skills: (p.skills || []).join(", "),
        builtProduct: i > 1 ? "Yes" : "No",
        previousHackathon: i > 2 ? "Yes" : "No",
        programmingLangs: (p.skills || []).filter(s => ["Python", "JavaScript", "TypeScript", "Go", "Node.js"].includes(s)),
        aiTools: ["Cursor", "GitHub Copilot"],
        aiModels: ["Claude / Anthropic", "ChatGPT / OpenAI"],
        attendanceCommitment: true,
        consentDataSharing: true,
        projectIdea: i === 0 ? "An AI code reviewer that gives actionable feedback" : "",
        "Which track interests you most?": hackathonData.tracks[i % 3].name,
      },
      aiScore: [85, 78, 92, 88, 72, null][i],
      aiReasoning: i < 5 ? "Strong skills and clear motivation. Good team potential." : null,
      aiRecommendation: i < 5 ? "accept" : null,
      status: regStatuses[i],
      createdAt: now,
      updatedAt: now,
    });
  }
  await regBatch.commit();
  console.log(`    ✓ ${TEST_PARTICIPANTS.length} registrations\n`);

  // 4. Create teams
  console.log("👥 Creating teams...");

  // Team 1: Lina (dev), Omar (designer), Noura (PM)
  const team1Id = "team-alpha";
  await db.doc(`events/${hackathonId}/teams/${team1Id}`).set({
    name: "Team Alpha — CodeForge",
    code: "ALPHA1",
    captainId: participantUids[2], // Noura (PM)
    hackathonId,
    track: "track-ai-tools",
    status: "submitted",
    isOpen: false,
    memberCount: 3,
    roleCounts: { pm: 1, developer: 1, designer: 1 },
    tags: ["starred", "finalist"],
    createdAt: now,
  });

  for (const [idx, role, isCaptain] of [[0, "developer", false], [1, "designer", false], [2, "pm", true]]) {
    await db.doc(`events/${hackathonId}/teams/${team1Id}/members/${participantUids[idx]}`).set({
      userId: participantUids[idx],
      userEmail: TEST_PARTICIPANTS[idx].email,
      role,
      isCaptain,
      joinedAt: now,
    });
  }

  // Team 2: Faisal (dev), Dana (dev), Youssef (dev — needs PM & designer)
  const team2Id = "team-beta";
  await db.doc(`events/${hackathonId}/teams/${team2Id}`).set({
    name: "Team Beta — NeuralNet",
    code: "BETA22",
    captainId: participantUids[3], // Faisal
    hackathonId,
    track: "track-ai-business",
    status: "accepted",
    isOpen: true,
    memberCount: 3,
    roleCounts: { developer: 2, pm: 0, designer: 1 },
    tags: [],
    createdAt: now,
  });

  for (const [idx, role, isCaptain] of [[3, "developer", true], [4, "developer", false], [5, "designer", false]]) {
    await db.doc(`events/${hackathonId}/teams/${team2Id}/members/${participantUids[idx]}`).set({
      userId: participantUids[idx],
      userEmail: TEST_PARTICIPANTS[idx].email,
      role,
      isCaptain,
      joinedAt: now,
    });
  }
  console.log("    ✓ 2 teams (Alpha CodeForge, Beta NeuralNet)\n");

  // 5. Create submissions
  console.log("📦 Creating submissions...");

  const sub1Id = "sub-codeforge";
  await db.doc(`events/${hackathonId}/submissions/${sub1Id}`).set({
    hackathonId, teamId: team1Id, submitterId: participantUids[0], submitterEmail: TEST_PARTICIPANTS[0].email,
    projectName: "CodeReview AI",
    description: "An AI-powered code review tool that analyzes pull requests, identifies bugs, suggests improvements, and rates code quality. Built with Claude API + React.",
    githubUrl: "https://github.com/demo/codereview-ai",
    demoUrl: "https://codereview-ai.demo.ramsha.net",
    videoUrl: "https://youtube.com/watch?v=demo1",
    techStack: ["React", "Node.js", "Claude API", "Firebase", "Tailwind CSS"],
    files: [
      { name: "CodeReview-AI-Pitch.pdf", url: "https://example.com/pitch.pdf", type: "presentation" },
      { name: "source-code.zip", url: "https://example.com/code.zip", type: "code" },
    ],
    status: "submitted",
    totalScore: 4.2,
    voteCount: 12,
    submittedAt: now, createdAt: now, updatedAt: now,
  });

  const sub2Id = "sub-neuralnet";
  await db.doc(`events/${hackathonId}/submissions/${sub2Id}`).set({
    hackathonId, teamId: team2Id, submitterId: participantUids[3], submitterEmail: TEST_PARTICIPANTS[3].email,
    projectName: "BizBot — AI Business Assistant",
    description: "An AI chatbot for Saudi SMEs that handles customer inquiries in Arabic and English, schedules meetings, and generates reports. Uses Gemini API.",
    githubUrl: "https://github.com/demo/bizbot",
    demoUrl: "https://bizbot.demo.ramsha.net",
    videoUrl: "https://youtube.com/watch?v=demo2",
    techStack: ["Next.js", "Gemini API", "Supabase", "Tailwind CSS", "Arabic NLP"],
    files: [{ name: "BizBot-Pitch.pdf", url: "https://example.com/bizbot-pitch.pdf", type: "presentation" }],
    status: "submitted",
    totalScore: 3.8,
    voteCount: 8,
    submittedAt: now, createdAt: now, updatedAt: now,
  });
  console.log("    ✓ 2 submissions (CodeReview AI, BizBot)\n");

  // 6. Create judge scores
  console.log("⚖️ Creating judge scores...");
  const criteria = hackathonData.judgingCriteria;
  const scores1 = [5, 4, 4, 4, 4]; // CodeReview AI
  const scores2 = [4, 4, 3, 4, 4]; // BizBot

  for (let i = 0; i < criteria.length; i++) {
    await db.collection(`events/${hackathonId}/scores`).add({
      judgeId: judgeUid, judgeEmail: TEST_JUDGE.email, hackathonId, submissionId: sub1Id,
      criteriaScores: { [criteria[i].name]: scores1[i] },
      totalScore: scores1[i], feedback: i === 0 ? "Excellent innovation. The Claude API integration is very clever." : "",
      scoredAt: now,
    });
    await db.collection(`events/${hackathonId}/scores`).add({
      judgeId: judgeUid, judgeEmail: TEST_JUDGE.email, hackathonId, submissionId: sub2Id,
      criteriaScores: { [criteria[i].name]: scores2[i] },
      totalScore: scores2[i], feedback: i === 0 ? "Good business case. Arabic NLP is promising but needs more work." : "",
      scoredAt: now,
    });
  }
  console.log("    ✓ 10 judge scores\n");

  // 7. Create judge assignment
  console.log("📋 Creating judge assignment...");
  await db.collection(`events/${hackathonId}/judgeAssignments`).add({
    judgeEmail: TEST_JUDGE.email, judgeName: TEST_JUDGE.displayName, judgeUid,
    assignedSubmissions: [sub1Id, sub2Id],
    inviteStatus: "accepted", hackathonId, invitedAt: now,
  });
  console.log("    ✓ Judge assigned\n");

  // 8. Create announcements
  console.log("📢 Creating announcements...");
  const annBatch = db.batch();
  const announcements = [
    { title: "Welcome to AI Builders Challenge!", content: "We're thrilled to have you! Check the Resources tab for starter kits and API credits.", channel: "platform" },
    { title: "Workshop: Intro to Claude API", content: "Join us tomorrow at 2 PM on Discord for a hands-on workshop on building with Claude API.", channel: "platform" },
    { title: "Submission Deadline Reminder", content: "Only 3 days left! Make sure to submit your project before April 25 at 11:59 PM.", channel: "platform" },
  ];
  for (const a of announcements) {
    const ref = db.collection(`events/${hackathonId}/announcements`).doc();
    annBatch.set(ref, { ...a, hackathonId, authorId: organizerUid, scheduledAt: null, sentAt: now, createdAt: now });
  }
  await annBatch.commit();
  console.log("    ✓ 3 announcements\n");

  // 9. Create workshops
  console.log("🎓 Creating workshops...");
  const wsBatch = db.batch();
  const workshops = [
    { title: "Intro to Claude API", description: "Learn how to build AI features with Anthropic's Claude API.", dateTime: "2026-04-21T14:00", durationMinutes: 90, platform: "discord", meetingLink: "https://discord.gg/ramsha-workshop" },
    { title: "Design Sprint for Hackathons", description: "A fast-paced design thinking session to help your team ideate.", dateTime: "2026-04-22T10:00", durationMinutes: 60, platform: "zoom", meetingLink: "https://zoom.us/j/ramsha-design" },
    { title: "Pitch Perfect: How to Present Your Project", description: "Tips and tricks for a winning 3-minute demo.", dateTime: "2026-04-24T16:00", durationMinutes: 45, platform: "discord", meetingLink: "https://discord.gg/ramsha-pitch" },
  ];
  for (const w of workshops) {
    const ref = db.collection(`events/${hackathonId}/workshops`).doc();
    wsBatch.set(ref, { ...w, hackathonId, resources: [], attendees: participantUids.slice(0, 4), createdAt: now });
  }
  await wsBatch.commit();
  console.log("    ✓ 3 workshops\n");

  // 10. Create notifications
  console.log("🔔 Creating notifications...");
  for (let i = 0; i < participantUids.length; i++) {
    await db.collection(`users/${participantUids[i]}/notifications`).add({
      type: "info", title: "Welcome!", body: "You're registered for AI Builders Challenge 2026.",
      hackathonId, link: `/event/${hackathonId}`, read: i > 2, createdAt: now,
    });
    if (i < 5) { // accepted participants
      await db.collection(`users/${participantUids[i]}/notifications`).add({
        type: "success", title: "Application Accepted!", body: "Congratulations! You've been accepted. Form a team now.",
        hackathonId, link: `/event/${hackathonId}/teams`, read: false, createdAt: now,
      });
    }
  }
  console.log("    ✓ Notifications for all participants\n");

  // 11. Create votes
  console.log("🗳️ Creating votes...");
  for (let i = 0; i < 4; i++) {
    await db.doc(`events/${hackathonId}/votes/${participantUids[i]}_${hackathonId}`).set({
      voterId: participantUids[i], voterEmail: TEST_PARTICIPANTS[i].email,
      hackathonId, submissionId: i < 2 ? sub1Id : sub2Id, votedAt: now,
    });
  }
  console.log("    ✓ 4 votes\n");

  // ── Summary ─────────────────────────────────────────────────────────────

  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ TEST DATA SEEDED SUCCESSFULLY!");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");
  console.log("  🔑 TEST ACCOUNTS:");
  console.log("  ─────────────────────────────────────────────────");
  console.log(`  Admin:      ${ADMIN_USER.email} / ${ADMIN_USER.password}`);
  console.log(`  Organizer:  ${TEST_ORGANIZER.email} / ${TEST_ORGANIZER.password}`);
  console.log(`  Judge:      ${TEST_JUDGE.email} / ${TEST_JUDGE.password}`);
  console.log(`  Sponsor:    ${TEST_SPONSOR.email} / ${TEST_SPONSOR.password}`);
  console.log("  ─────────────────────────────────────────────────");
  TEST_PARTICIPANTS.forEach(p => console.log(`  Participant: ${p.email} / ${p.password}`));
  console.log("");
  console.log(`  🏆 Hackathon: ${hackathonData.title}`);
  console.log(`     Slug: ai-builders-2026`);
  console.log(`     URL: /hackathon/ai-builders-2026`);
  console.log(`     Teams: Alpha CodeForge (code: ALPHA1), Beta NeuralNet (code: BETA22)`);
  console.log(`     Submissions: CodeReview AI, BizBot`);
  console.log("");
  console.log("  🧪 ADMIN TEST PAGE: /admin/test");
  console.log(`     Login: ${ADMIN_USER.email} / ${ADMIN_USER.password}`);
  console.log("═══════════════════════════════════════════════════════\n");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
