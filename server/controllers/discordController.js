/**
 * Ramsha — Discord Controller
 *
 * API endpoints for Discord integration:
 * - Setup Discord server for a hackathon
 * - Create per-team channels on acceptance
 * - Send announcements to Discord
 */

const admin = require("firebase-admin");
const { createHackathonServer, createTeamChannel, sendAnnouncement } = require("../services/discordService");

const db = () => admin.firestore();
const eventsCol = () => db().collection("events");
const hackathonsCol = () => db().collection("hackathons");

async function getEventDoc(id) {
  let snap = await eventsCol().doc(id).get();
  if (snap.exists) return snap;
  return hackathonsCol().doc(id).get();
}

// ── POST /api/hackathons/:id/discord/setup ─────────────────────────────────
// Create a Discord server for this hackathon

async function setupDiscord(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });

    const event = hSnap.data();
    if (event.organizerId !== req.uid) return res.status(403).json({ error: "Not authorized." });

    // Check if already set up
    if (event.discordGuildId) {
      return res.status(400).json({
        error: "Discord already set up for this hackathon.",
        inviteUrl: event.discordInviteUrl,
      });
    }

    const { defaultChannels } = req.body;
    const title = event.title || event.name || "Ramsha Hackathon";

    const result = await createHackathonServer(title, defaultChannels);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    // Save Discord info to both collections
    const discordData = {
      discordGuildId: result.guildId,
      discordInviteUrl: result.inviteUrl,
      discordTeamsCategoryId: result.teamsCategoryId,
      discordChannels: result.channels,
    };

    await eventsCol().doc(id).update(discordData).catch(() => {});
    await hackathonsCol().doc(id).update(discordData).catch(() => {});

    return res.json({
      message: "Discord server created!",
      ...discordData,
    });
  } catch (err) {
    console.error("setupDiscord error:", err);
    return res.status(500).json({ error: "Failed to set up Discord." });
  }
}

// ── POST /api/hackathons/:id/discord/team-channel ──────────────────────────
// Create a private channel for a team (called on acceptance)

async function createTeamDiscordChannel(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { teamId, teamName } = req.body;

    if (!teamId || !teamName) {
      return res.status(400).json({ error: "teamId and teamName are required." });
    }

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });

    const event = hSnap.data();
    if (event.organizerId !== req.uid) return res.status(403).json({ error: "Not authorized." });

    if (!event.discordGuildId) {
      return res.status(400).json({ error: "Discord not set up for this hackathon. Call setup first." });
    }

    const result = await createTeamChannel(
      event.discordGuildId,
      event.discordTeamsCategoryId,
      teamName
    );

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    // Save channel ID to team document
    await eventsCol().doc(id).collection("teams").doc(teamId).update({
      discordChannelId: result.channelId,
      discordChannelName: result.channelName,
    }).catch(() => {});

    return res.json({
      message: "Team channel created!",
      channelId: result.channelId,
      channelName: result.channelName,
    });
  } catch (err) {
    console.error("createTeamDiscordChannel error:", err);
    return res.status(500).json({ error: "Failed to create team channel." });
  }
}

// ── POST /api/hackathons/:id/discord/announce ──────────────────────────────
// Send an announcement to a Discord channel

async function sendDiscordAnnouncement(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const { title, content, channelName } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "title and content are required." });
    }

    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });

    const event = hSnap.data();
    if (event.organizerId !== req.uid) return res.status(403).json({ error: "Not authorized." });

    if (!event.discordGuildId || !event.discordChannels) {
      return res.status(400).json({ error: "Discord not set up." });
    }

    // Default to announcements channel
    const targetChannel = channelName || "announcements";
    const channelId = event.discordChannels[targetChannel];

    if (!channelId) {
      return res.status(400).json({ error: `Channel "${targetChannel}" not found.` });
    }

    const result = await sendAnnouncement(event.discordGuildId, channelId, title, content);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({ message: "Announcement sent to Discord!" });
  } catch (err) {
    console.error("sendDiscordAnnouncement error:", err);
    return res.status(500).json({ error: "Failed to send announcement." });
  }
}

// ── GET /api/hackathons/:id/discord/status ─────────────────────────────────

async function getDiscordStatus(req, res) {
  try {
    const id = req.params.id || req.params.eventId;
    const hSnap = await getEventDoc(id);
    if (!hSnap.exists) return res.status(404).json({ error: "Event not found." });

    const event = hSnap.data();
    return res.json({
      configured: !!event.discordGuildId,
      guildId: event.discordGuildId || null,
      inviteUrl: event.discordInviteUrl || null,
      channels: event.discordChannels || {},
    });
  } catch (err) {
    console.error("getDiscordStatus error:", err);
    return res.status(500).json({ error: "Failed to get Discord status." });
  }
}

module.exports = {
  setupDiscord,
  createTeamDiscordChannel,
  sendDiscordAnnouncement,
  getDiscordStatus,
};
