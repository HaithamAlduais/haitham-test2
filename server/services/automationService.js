/**
 * Ramsha — Automation Service
 *
 * Central hub for all automated actions triggered by status changes.
 * Every status change in the platform flows through here.
 *
 * Triggers:
 * - Registration submitted → confirmation email
 * - Registration accepted → acceptance email + starter kit + Discord invite
 * - Registration rejected → rejection email
 * - Team accepted → Discord team channel + email to all members
 * - Submission finalized → notification to organizer
 * - Judging complete → winner emails + badge awards
 * - Hackathon published → Discord server created
 */

const admin = require("firebase-admin");
const { sendTemplatedEmail } = require("./emailService");
const { createHackathonServer, createTeamChannel, sendAnnouncement } = require("./discordService");
const { createNotification } = require("../controllers/notificationController");

const db = () => admin.firestore();
const eventsCol = () => db().collection("events");

// ── Registration Triggers ──────────────────────────────────────────────────

/**
 * Called when a new registration is submitted.
 */
async function onRegistrationSubmitted({ hackathon, registration, hackathonId }) {
  const participantName = registration.formResponses?.name || registration.userEmail?.split("@")[0] || "Participant";
  const hackathonUrl = `https://ramsha.net/hackathon/${hackathon.slug || hackathonId}`;

  // Send confirmation email
  await sendTemplatedEmail("registration_confirmation", {
    to: registration.userEmail,
    data: { participantName, hackathonTitle: hackathon.title || hackathon.name, hackathonUrl },
  });

  // Create notification
  await createNotification(registration.userId, {
    type: "info",
    title: "Registration Received",
    body: `Your registration for ${hackathon.title || hackathon.name} has been received.`,
    hackathonId,
    link: `/event/${hackathonId}`,
  });

  console.log(`[Automation] Registration submitted: ${registration.userEmail} → ${hackathon.title}`);
}

/**
 * Called when a registration is accepted.
 */
async function onRegistrationAccepted({ hackathon, registration, hackathonId }) {
  const participantName = registration.formResponses?.name || registration.userEmail?.split("@")[0] || "Participant";
  const hackathonUrl = `https://ramsha.net/hackathon/${hackathon.slug || hackathonId}`;

  // Gather starter kit resources
  let starterKitResources = [];
  try {
    const resSnap = await eventsCol().doc(hackathonId).collection("resources")
      .where("autoSendOnAccept", "==", true).get();
    starterKitResources = resSnap.docs.map(d => ({ title: d.data().title, url: d.data().url }));
  } catch {}

  // Send acceptance email with starter kit + Discord invite
  await sendTemplatedEmail("acceptance", {
    to: registration.userEmail,
    data: {
      participantName,
      hackathonTitle: hackathon.title || hackathon.name,
      hackathonUrl,
      discordInviteUrl: hackathon.discordInviteUrl || null,
      starterKitResources,
    },
  });

  // Create notification
  await createNotification(registration.userId, {
    type: "success",
    title: "Application Accepted!",
    body: `Congratulations! You've been accepted to ${hackathon.title || hackathon.name}. Form a team now!`,
    hackathonId,
    link: `/event/${hackathonId}/teams`,
  });

  console.log(`[Automation] Registration accepted: ${registration.userEmail}`);
}

/**
 * Called when a registration is rejected.
 */
async function onRegistrationRejected({ hackathon, registration, hackathonId }) {
  const participantName = registration.formResponses?.name || registration.userEmail?.split("@")[0] || "Participant";

  await sendTemplatedEmail("rejection", {
    to: registration.userEmail,
    data: { participantName, hackathonTitle: hackathon.title || hackathon.name },
  });

  await createNotification(registration.userId, {
    type: "warning",
    title: "Application Update",
    body: `Your application for ${hackathon.title || hackathon.name} was not accepted this time.`,
    hackathonId,
    link: `/explore`,
  });

  console.log(`[Automation] Registration rejected: ${registration.userEmail}`);
}

// ── Team Triggers ──────────────────────────────────────────────────────────

/**
 * Called when a team is accepted by the organizer.
 */
async function onTeamAccepted({ hackathon, team, teamId, hackathonId }) {
  // Create Discord channel for the team
  if (hackathon.discordGuildId) {
    try {
      const result = await createTeamChannel(
        hackathon.discordGuildId,
        hackathon.discordTeamsCategoryId,
        team.name
      );
      if (result.channelId) {
        // Save Discord channel to team doc
        await eventsCol().doc(hackathonId).collection("teams").doc(teamId).update({
          discordChannelId: result.channelId,
          discordChannelName: result.channelName,
        });
      }
    } catch (err) {
      console.warn("[Automation] Discord channel creation failed:", err.message);
    }
  }

  // Email all team members
  try {
    const membersSnap = await eventsCol().doc(hackathonId)
      .collection("teams").doc(teamId).collection("members").get();

    for (const memberDoc of membersSnap.docs) {
      const member = memberDoc.data();
      await sendTemplatedEmail("acceptance", {
        to: member.userEmail,
        data: {
          participantName: member.userEmail.split("@")[0],
          hackathonTitle: hackathon.title || hackathon.name,
          hackathonUrl: `https://ramsha.net/hackathon/${hackathon.slug || hackathonId}`,
          discordInviteUrl: hackathon.discordInviteUrl || null,
          starterKitResources: [],
        },
      });

      // Notification
      await createNotification(member.userId, {
        type: "success",
        title: `Team "${team.name}" Accepted!`,
        body: `Your team has been accepted for ${hackathon.title || hackathon.name}. Start building!`,
        hackathonId,
        link: `/event/${hackathonId}`,
      });
    }
  } catch (err) {
    console.warn("[Automation] Team member emails failed:", err.message);
  }

  console.log(`[Automation] Team accepted: ${team.name} (${teamId})`);
}

// ── Hackathon Triggers ─────────────────────────────────────────────────────

/**
 * Called when a hackathon is published — auto-creates Discord server.
 */
async function onHackathonPublished({ hackathon, hackathonId }) {
  // Auto-create Discord server if not already set up
  if (!hackathon.discordGuildId && process.env.DISCORD_BOT_TOKEN) {
    try {
      const defaultChannels = ["announcements", "general", "help", "resources", "introductions"];
      const result = await createHackathonServer(
        hackathon.title || hackathon.name || "Ramsha Hackathon",
        defaultChannels
      );

      if (result.guildId) {
        const discordData = {
          discordGuildId: result.guildId,
          discordInviteUrl: result.inviteUrl,
          discordTeamsCategoryId: result.teamsCategoryId,
          discordChannels: result.channels,
        };
        await eventsCol().doc(hackathonId).update(discordData).catch(() => {});
        await db().collection("hackathons").doc(hackathonId).update(discordData).catch(() => {});

        console.log(`[Automation] Discord server created: ${result.inviteUrl}`);
      }
    } catch (err) {
      console.warn("[Automation] Discord server creation failed:", err.message);
    }
  }

  console.log(`[Automation] Hackathon published: ${hackathon.title}`);
}

/**
 * Called when winners are announced — emails + badges.
 */
async function onWinnersAnnounced({ hackathon, hackathonId, winners }) {
  for (const winner of winners) {
    // Email winner
    await sendTemplatedEmail("winner_notification", {
      to: winner.email,
      data: {
        participantName: winner.name || winner.email.split("@")[0],
        hackathonTitle: hackathon.title || hackathon.name,
        prizeTitle: winner.prizeTitle || "Winner",
        prizeValue: winner.prizeValue || "",
      },
    });

    // Notification
    if (winner.userId) {
      await createNotification(winner.userId, {
        type: "success",
        title: `You Won — ${winner.prizeTitle}!`,
        body: `Congratulations! You won ${winner.prizeTitle} at ${hackathon.title || hackathon.name}!`,
        hackathonId,
        link: `/event/${hackathonId}/winners`,
      });
    }
  }

  console.log(`[Automation] Winners announced: ${winners.length} winners notified`);
}

// ── Submission Triggers ────────────────────────────────────────────────────

/**
 * Called when a submission is finalized.
 */
async function onSubmissionFinalized({ hackathon, submission, hackathonId }) {
  // Notify organizer
  if (hackathon.organizerId) {
    await createNotification(hackathon.organizerId, {
      type: "info",
      title: "New Submission",
      body: `"${submission.projectName}" was submitted by ${submission.submitterEmail}.`,
      hackathonId,
      link: `/hackathons/${hackathonId}`,
    });
  }

  console.log(`[Automation] Submission finalized: ${submission.projectName}`);
}

// ── Discord Announcement Helper ────────────────────────────────────────────

/**
 * Send an announcement to Discord (if configured).
 */
async function sendDiscordAnnouncementIfConfigured({ hackathon, hackathonId, title, content }) {
  if (!hackathon.discordGuildId || !hackathon.discordChannels?.announcements) return;

  try {
    await sendAnnouncement(
      hackathon.discordGuildId,
      hackathon.discordChannels.announcements,
      title,
      content
    );
  } catch (err) {
    console.warn("[Automation] Discord announcement failed:", err.message);
  }
}

module.exports = {
  onRegistrationSubmitted,
  onRegistrationAccepted,
  onRegistrationRejected,
  onTeamAccepted,
  onHackathonPublished,
  onWinnersAnnounced,
  onSubmissionFinalized,
  sendDiscordAnnouncementIfConfigured,
};
