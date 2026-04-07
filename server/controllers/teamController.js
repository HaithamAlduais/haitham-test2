const admin = require("firebase-admin");
const { TEAM_STATUS } = require("../lib/constants");

const db = () => admin.firestore();
const hackathonsCol = () => db().collection("hackathons");

function teamsCol(hackathonId) {
  return hackathonsCol().doc(hackathonId).collection("teams");
}

function membersCol(hackathonId, teamId) {
  return teamsCol(hackathonId).doc(teamId).collection("members");
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── POST /api/hackathons/:id/teams ──────────────────────────────────────────

async function createTeam(req, res) {
  try {
    const { id } = req.params;
    const { name, track } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Team name is required." });
    }

    const hSnap = await hackathonsCol().doc(id).get();
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });

    const now = admin.firestore.FieldValue.serverTimestamp();
    const code = generateCode();

    const teamData = {
      name: name.trim(),
      code,
      captainId: req.uid,
      hackathonId: id,
      track: track || null,
      status: TEAM_STATUS.FORMING,
      memberCount: 1,
      createdAt: now,
    };

    const docRef = await teamsCol(id).add(teamData);

    // Add captain as first member
    await membersCol(id, docRef.id).doc(req.uid).set({
      userId: req.uid,
      userEmail: req.email,
      role: "captain",
      joinedAt: now,
    });

    // Increment team count
    await hackathonsCol().doc(id).update({
      teamCount: admin.firestore.FieldValue.increment(1),
    });

    return res.status(201).json({ id: docRef.id, ...teamData, code, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("createTeam error:", err);
    return res.status(500).json({ error: "Failed to create team." });
  }
}

// ── POST /api/hackathons/:id/teams/join ─────────────────────────────────────

async function joinTeam(req, res) {
  try {
    const { id } = req.params;
    const { code, role } = req.body;

    if (!code) return res.status(400).json({ error: "Team code is required." });

    const hSnap = await hackathonsCol().doc(id).get();
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    const hackathon = hSnap.data();

    // Find team by code
    const teamSnap = await teamsCol(id).where("code", "==", code.toUpperCase()).limit(1).get();
    if (teamSnap.empty) {
      return res.status(404).json({ error: "Team not found with that code." });
    }

    const teamDoc = teamSnap.docs[0];
    const team = teamDoc.data();

    // Check team size limit
    const maxSize = hackathon.settings?.teamSizeMax || 5;
    if ((team.memberCount || 1) >= maxSize) {
      return res.status(400).json({ error: "Team is full." });
    }

    // Check if already a member
    const existingMember = await membersCol(id, teamDoc.id).doc(req.uid).get();
    if (existingMember.exists) {
      return res.status(409).json({ error: "You are already in this team." });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    await membersCol(id, teamDoc.id).doc(req.uid).set({
      userId: req.uid,
      userEmail: req.email,
      role: role || "member",
      joinedAt: now,
    });

    await teamsCol(id).doc(teamDoc.id).update({
      memberCount: admin.firestore.FieldValue.increment(1),
    });

    return res.json({ message: "Joined team successfully.", teamId: teamDoc.id, teamName: team.name });
  } catch (err) {
    console.error("joinTeam error:", err);
    return res.status(500).json({ error: "Failed to join team." });
  }
}

// ── GET /api/hackathons/:id/teams ───────────────────────────────────────────

async function listTeams(req, res) {
  try {
    const { id } = req.params;
    const snap = await teamsCol(id).orderBy("createdAt", "desc").limit(50).get();
    const teams = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ data: teams });
  } catch (err) {
    console.error("listTeams error:", err);
    return res.status(500).json({ error: "Failed to list teams." });
  }
}

// ── GET /api/hackathons/:id/teams/:teamId ───────────────────────────────────

async function getTeam(req, res) {
  try {
    const { id, teamId } = req.params;
    const teamSnap = await teamsCol(id).doc(teamId).get();
    if (!teamSnap.exists) return res.status(404).json({ error: "Team not found." });

    // Fetch members
    const membersSnap = await membersCol(id, teamId).get();
    const members = membersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return res.json({ id: teamSnap.id, ...teamSnap.data(), members });
  } catch (err) {
    console.error("getTeam error:", err);
    return res.status(500).json({ error: "Failed to get team." });
  }
}

// ── POST /api/hackathons/:id/teams/:teamId/leave ────────────────────────────

async function leaveTeam(req, res) {
  try {
    const { id, teamId } = req.params;
    const teamSnap = await teamsCol(id).doc(teamId).get();
    if (!teamSnap.exists) return res.status(404).json({ error: "Team not found." });

    const team = teamSnap.data();
    if (team.captainId === req.uid) {
      return res.status(400).json({ error: "Captain cannot leave. Transfer captaincy or delete the team." });
    }

    const memberRef = membersCol(id, teamId).doc(req.uid);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) {
      return res.status(400).json({ error: "You are not a member of this team." });
    }

    await memberRef.delete();
    await teamsCol(id).doc(teamId).update({
      memberCount: admin.firestore.FieldValue.increment(-1),
    });

    return res.json({ message: "Left team successfully." });
  } catch (err) {
    console.error("leaveTeam error:", err);
    return res.status(500).json({ error: "Failed to leave team." });
  }
}

// ── GET /api/hackathons/:id/teams/admin/all ─────────────────────────────────

async function listAllTeamsAdmin(req, res) {
  try {
    const { id } = req.params;

    // Verify ownership
    const hSnap = await hackathonsCol().doc(id).get();
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "You do not own this hackathon." });
    }

    const snap = await teamsCol(id).orderBy("createdAt", "desc").get();
    const teams = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return res.json({ data: teams });
  } catch (err) {
    console.error("listAllTeamsAdmin error:", err);
    return res.status(500).json({ error: "Failed to list teams." });
  }
}

module.exports = {
  createTeam,
  joinTeam,
  listTeams,
  getTeam,
  leaveTeam,
  listAllTeamsAdmin,
};
