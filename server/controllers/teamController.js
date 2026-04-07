const admin = require("firebase-admin");
const { TEAM_STATUS, TEAM_ROLES, JOIN_REQUEST_STATUS } = require("../lib/constants");
const { onTeamAccepted } = require("../services/automationService");

const db = () => admin.firestore();
const eventsCol = () => db().collection("events");
const hackathonsCol = () => db().collection("hackathons");

async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return hackathonsCol().doc(id).get();
}

function teamsCol(eventId) {
  return eventsCol().doc(eventId).collection("teams");
}

function membersCol(eventId, teamId) {
  return teamsCol(eventId).doc(teamId).collection("members");
}

function joinRequestsCol(eventId, teamId) {
  return teamsCol(eventId).doc(teamId).collection("joinRequests");
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── POST /api/hackathons/:id/teams ──────────────────────────────────────────

async function createTeam(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { name, track, role } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Team name is required." });
    }

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });

    const now = admin.firestore.FieldValue.serverTimestamp();
    const code = generateCode();

    // Captain role — defaults to "captain", but if they specify a functional role, store both
    const memberRole = role && Object.values(TEAM_ROLES).includes(role) ? role : TEAM_ROLES.CAPTAIN;

    const teamData = {
      name: name.trim(),
      code,
      captainId: req.uid,
      hackathonId: id,
      track: track || null,
      status: TEAM_STATUS.FORMING,
      isOpen: true, // visible for join requests
      memberCount: 1,
      roleCounts: { [memberRole]: 1 },
      createdAt: now,
    };

    const docRef = await teamsCol(id).add(teamData);

    await membersCol(id, docRef.id).doc(req.uid).set({
      userId: req.uid,
      userEmail: req.email,
      role: memberRole,
      isCaptain: true,
      joinedAt: now,
    });

    // Increment team count
    await eventsCol().doc(id).update({
      teamCount: admin.firestore.FieldValue.increment(1),
    }).catch(() => hackathonsCol().doc(id).update({
      teamCount: admin.firestore.FieldValue.increment(1),
    }));

    return res.status(201).json({ id: docRef.id, ...teamData, code, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("createTeam error:", err);
    return res.status(500).json({ error: "Failed to create team." });
  }
}

// ── POST /api/hackathons/:id/teams/join ─────────────────────────────────────

async function joinTeam(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { code, role } = req.body;

    if (!code) return res.status(400).json({ error: "Team code is required." });

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    const hackathon = hSnap.data();

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

    // Validate role against slot limits if roleSlots configured
    const memberRole = role && Object.values(TEAM_ROLES).includes(role) ? role : "member";
    const roleSlots = hackathon.settings?.roleSlots;
    if (roleSlots && roleSlots[memberRole]) {
      const currentCount = (team.roleCounts && team.roleCounts[memberRole]) || 0;
      const maxForRole = roleSlots[memberRole].max || 99;
      if (currentCount >= maxForRole) {
        return res.status(400).json({
          error: `No more ${memberRole} slots available. (${currentCount}/${maxForRole})`,
        });
      }
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    await membersCol(id, teamDoc.id).doc(req.uid).set({
      userId: req.uid,
      userEmail: req.email,
      role: memberRole,
      isCaptain: false,
      joinedAt: now,
    });

    // Update team counters
    const updateData = {
      memberCount: admin.firestore.FieldValue.increment(1),
    };
    if (memberRole !== "member") {
      updateData[`roleCounts.${memberRole}`] = admin.firestore.FieldValue.increment(1);
    }
    await teamsCol(id).doc(teamDoc.id).update(updateData);

    return res.json({ message: "Joined team successfully.", teamId: teamDoc.id, teamName: team.name });
  } catch (err) {
    console.error("joinTeam error:", err);
    return res.status(500).json({ error: "Failed to join team." });
  }
}

// ── POST /api/hackathons/:id/teams/:teamId/request ─────────────────────────
// Request to join an open team (captain must approve)

async function requestToJoin(req, res) {
  try {
    const { id, teamId } = req.params;
    const { role, message } = req.body;

    const teamSnap = await teamsCol(id).doc(teamId).get();
    if (!teamSnap.exists) return res.status(404).json({ error: "Team not found." });
    const team = teamSnap.data();

    if (!team.isOpen) {
      return res.status(400).json({ error: "This team is not accepting requests." });
    }

    // Check if already a member
    const existingMember = await membersCol(id, teamId).doc(req.uid).get();
    if (existingMember.exists) {
      return res.status(409).json({ error: "You are already in this team." });
    }

    // Check for existing pending request
    const existingReq = await joinRequestsCol(id, teamId)
      .where("userId", "==", req.uid)
      .where("status", "==", JOIN_REQUEST_STATUS.PENDING)
      .limit(1).get();
    if (!existingReq.empty) {
      return res.status(409).json({ error: "You already have a pending request." });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const reqData = {
      userId: req.uid,
      userEmail: req.email,
      role: role || "member",
      message: message || "",
      status: JOIN_REQUEST_STATUS.PENDING,
      createdAt: now,
    };

    const docRef = await joinRequestsCol(id, teamId).add(reqData);
    return res.status(201).json({ id: docRef.id, ...reqData, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("requestToJoin error:", err);
    return res.status(500).json({ error: "Failed to submit join request." });
  }
}

// ── PATCH /api/hackathons/:id/teams/:teamId/request/:reqId ─────────────────
// Captain approves or rejects a join request

async function handleJoinRequest(req, res) {
  try {
    const { id, teamId, reqId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "action must be 'approve' or 'reject'." });
    }

    const teamSnap = await teamsCol(id).doc(teamId).get();
    if (!teamSnap.exists) return res.status(404).json({ error: "Team not found." });
    const team = teamSnap.data();

    // Only captain can approve/reject
    if (team.captainId !== req.uid) {
      return res.status(403).json({ error: "Only the team captain can manage requests." });
    }

    const reqSnap = await joinRequestsCol(id, teamId).doc(reqId).get();
    if (!reqSnap.exists) return res.status(404).json({ error: "Request not found." });
    const requestData = reqSnap.data();

    if (requestData.status !== JOIN_REQUEST_STATUS.PENDING) {
      return res.status(400).json({ error: "This request has already been processed." });
    }

    if (action === "reject") {
      await joinRequestsCol(id, teamId).doc(reqId).update({ status: JOIN_REQUEST_STATUS.REJECTED });
      return res.json({ message: "Request rejected." });
    }

    // Approve: check team size
    const hSnap = await getEventDoc(id);
    const hackathon = hSnap.exists ? hSnap.data() : {};
    const maxSize = hackathon.settings?.teamSizeMax || 5;

    if ((team.memberCount || 1) >= maxSize) {
      return res.status(400).json({ error: "Team is full. Cannot approve." });
    }

    // Check role slot if applicable
    const memberRole = requestData.role || "member";
    const roleSlots = hackathon.settings?.roleSlots;
    if (roleSlots && roleSlots[memberRole]) {
      const currentCount = (team.roleCounts && team.roleCounts[memberRole]) || 0;
      if (currentCount >= (roleSlots[memberRole].max || 99)) {
        return res.status(400).json({ error: `No ${memberRole} slots available.` });
      }
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    // Add as member
    await membersCol(id, teamId).doc(requestData.userId).set({
      userId: requestData.userId,
      userEmail: requestData.userEmail,
      role: memberRole,
      isCaptain: false,
      joinedAt: now,
    });

    // Update counters
    const updateData = { memberCount: admin.firestore.FieldValue.increment(1) };
    if (memberRole !== "member") {
      updateData[`roleCounts.${memberRole}`] = admin.firestore.FieldValue.increment(1);
    }
    await teamsCol(id).doc(teamId).update(updateData);

    // Update request status
    await joinRequestsCol(id, teamId).doc(reqId).update({ status: JOIN_REQUEST_STATUS.APPROVED });

    return res.json({ message: "Request approved. Member added." });
  } catch (err) {
    console.error("handleJoinRequest error:", err);
    return res.status(500).json({ error: "Failed to process request." });
  }
}

// ── GET /api/hackathons/:id/teams/:teamId/requests ─────────────────────────

async function listJoinRequests(req, res) {
  try {
    const { id, teamId } = req.params;

    const teamSnap = await teamsCol(id).doc(teamId).get();
    if (!teamSnap.exists) return res.status(404).json({ error: "Team not found." });

    // Only captain or organizer
    const team = teamSnap.data();
    if (team.captainId !== req.uid) {
      const hSnap = await getEventDoc(id);
      if (!hSnap.exists || hSnap.data().organizerId !== req.uid) {
        return res.status(403).json({ error: "Not authorized." });
      }
    }

    const snap = await joinRequestsCol(id, teamId).orderBy("createdAt", "desc").get();
    const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ data: requests });
  } catch (err) {
    console.error("listJoinRequests error:", err);
    return res.status(500).json({ error: "Failed to list requests." });
  }
}

// ── GET /api/hackathons/:id/teams ───────────────────────────────────────────

async function listTeams(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
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

    const memberData = memberSnap.data();
    await memberRef.delete();

    // Decrement counters
    const updateData = { memberCount: admin.firestore.FieldValue.increment(-1) };
    if (memberData.role && memberData.role !== "member") {
      updateData[`roleCounts.${memberData.role}`] = admin.firestore.FieldValue.increment(-1);
    }
    await teamsCol(id).doc(teamId).update(updateData);

    return res.json({ message: "Left team successfully." });
  } catch (err) {
    console.error("leaveTeam error:", err);
    return res.status(500).json({ error: "Failed to leave team." });
  }
}

// ── GET /api/hackathons/:id/teams/admin/all ─────────────────────────────────

async function listAllTeamsAdmin(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const hSnap = await getEventDoc(id);
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

// ── PATCH /api/hackathons/:id/teams/:teamId/tags ───────────────────────────
// Organizer-only: update tags on a team

const ALLOWED_TAGS = ["starred", "priority", "review", "finalist", "disqualified", "needs-review"];

async function updateTeamTags(req, res) {
  try {
    const { id, teamId } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: "tags must be an array." });
    }

    // Filter to only allowed tag values
    const validTags = tags.filter((t) => typeof t === "string" && ALLOWED_TAGS.includes(t));

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "You do not own this hackathon." });
    }

    const teamSnap = await teamsCol(id).doc(teamId).get();
    if (!teamSnap.exists) return res.status(404).json({ error: "Team not found." });

    await teamsCol(id).doc(teamId).update({
      tags: validTags,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ message: "Tags updated.", tags: validTags });
  } catch (err) {
    console.error("updateTeamTags error:", err);
    return res.status(500).json({ error: "Failed to update team tags." });
  }
}

// ── PATCH /api/hackathons/:id/teams/:teamId/status ──────────────────────────
// Organizer updates team status (accept/reject) — triggers automation

async function updateTeamStatus(req, res) {
  try {
    const { id, teamId } = req.params;
    const { status: newStatus } = req.body;

    const validStatuses = Object.values(TEAM_STATUS);
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: `Invalid status. Must be: ${validStatuses.join(", ")}` });
    }

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Hackathon not found." });
    if (hSnap.data().organizerId !== req.uid) {
      return res.status(403).json({ error: "Not authorized." });
    }

    const teamSnap = await teamsCol(id).doc(teamId).get();
    if (!teamSnap.exists) return res.status(404).json({ error: "Team not found." });

    await teamsCol(id).doc(teamId).update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // AUTOMATION: on acceptance → Discord channel + emails to all members
    if (newStatus === TEAM_STATUS.ACCEPTED) {
      const hackathon = hSnap.data();
      const team = teamSnap.data();
      onTeamAccepted({ hackathon, team, teamId, hackathonId: id }).catch(console.warn);
    }

    return res.json({ message: `Team status updated to "${newStatus}".` });
  } catch (err) {
    console.error("updateTeamStatus error:", err);
    return res.status(500).json({ error: "Failed to update team status." });
  }
}

module.exports = {
  createTeam,
  joinTeam,
  requestToJoin,
  handleJoinRequest,
  listJoinRequests,
  listTeams,
  getTeam,
  leaveTeam,
  listAllTeamsAdmin,
  updateTeamTags,
  updateTeamStatus,
};
