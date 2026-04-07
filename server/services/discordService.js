/**
 * Ramsha — Discord Auto-Setup Service
 *
 * Creates Discord servers/channels when teams are accepted.
 * Requires DISCORD_BOT_TOKEN in server/.env
 *
 * Features:
 * - Auto-create a Discord server per hackathon (or use existing)
 * - Create per-team private text channels
 * - Create organizer-defined channels (announcements, help, general, resources)
 * - Generate invite links
 * - Send announcements to Discord channels
 */

const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } = require("discord.js");

let client = null;
let ready = false;

function getClient() {
  if (client) return client;

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.warn("DISCORD_BOT_TOKEN not set — Discord integration disabled.");
    return null;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ],
  });

  client.on("ready", () => {
    console.log(`Discord bot logged in as ${client.user.tag}`);
    ready = true;
  });

  client.on("error", (err) => {
    console.error("Discord client error:", err.message);
  });

  client.login(token).catch((err) => {
    console.error("Discord login failed:", err.message);
    client = null;
  });

  return client;
}

/**
 * Create a Discord server (guild) for a hackathon.
 * @param {string} hackathonTitle
 * @param {string[]} defaultChannels - e.g. ["announcements", "general", "help", "resources"]
 * @returns {Promise<{guildId, inviteUrl, channels}>}
 */
async function createHackathonServer(hackathonTitle, defaultChannels = []) {
  const bot = getClient();
  if (!bot || !ready) {
    return { error: "Discord bot not available.", guildId: null, inviteUrl: null };
  }

  try {
    // Create the server
    const guild = await bot.guilds.create({
      name: hackathonTitle.substring(0, 100),
    });

    // Create default channels
    const channelMap = {};

    // Remove the default #general that Discord creates
    const existingChannels = await guild.channels.fetch();
    for (const [, ch] of existingChannels) {
      if (ch.type === ChannelType.GuildText) {
        await ch.delete().catch(() => {});
      }
    }

    // Create organizer-defined channels
    const channelsToCreate = defaultChannels.length > 0
      ? defaultChannels
      : ["announcements", "general", "help", "resources"];

    for (const name of channelsToCreate) {
      const ch = await guild.channels.create({
        name: name.toLowerCase().replace(/\s+/g, "-"),
        type: ChannelType.GuildText,
      });
      channelMap[name] = ch.id;
    }

    // Create "teams" category for per-team channels
    const teamsCategory = await guild.channels.create({
      name: "Teams",
      type: ChannelType.GuildCategory,
    });

    // Generate invite link
    const announcementChannel = Object.values(channelMap)[0];
    const invite = await guild.invites.create(announcementChannel || guild.systemChannelId, {
      maxAge: 0, // never expires
      maxUses: 0, // unlimited
    });

    return {
      guildId: guild.id,
      inviteUrl: `https://discord.gg/${invite.code}`,
      teamsCategoryId: teamsCategory.id,
      channels: channelMap,
    };
  } catch (err) {
    console.error("Failed to create Discord server:", err.message);
    return { error: err.message, guildId: null, inviteUrl: null };
  }
}

/**
 * Create a private channel for a team within an existing guild.
 * @param {string} guildId
 * @param {string} teamsCategoryId
 * @param {string} teamName
 * @param {string[]} memberDiscordIds - Discord user IDs to give access (optional)
 * @returns {Promise<{channelId, channelName}>}
 */
async function createTeamChannel(guildId, teamsCategoryId, teamName) {
  const bot = getClient();
  if (!bot || !ready) {
    return { error: "Discord bot not available." };
  }

  try {
    const guild = await bot.guilds.fetch(guildId);
    const channelName = `team-${teamName.toLowerCase().replace(/[^a-z0-9-]/g, "-").substring(0, 90)}`;

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: teamsCategoryId || undefined,
      permissionOverwrites: [
        {
          // Deny everyone by default (private channel)
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
      ],
    });

    // Send welcome message
    await channel.send({
      content: `🎉 **Welcome, ${teamName}!**\n\nThis is your private team channel. Use it to coordinate, share ideas, and collaborate.\n\nGood luck! 🚀`,
    });

    return { channelId: channel.id, channelName: channel.name };
  } catch (err) {
    console.error("Failed to create team channel:", err.message);
    return { error: err.message };
  }
}

/**
 * Send an announcement to a specific channel.
 * @param {string} guildId
 * @param {string} channelId
 * @param {string} title
 * @param {string} content
 */
async function sendAnnouncement(guildId, channelId, title, content) {
  const bot = getClient();
  if (!bot || !ready) return { error: "Discord bot not available." };

  try {
    const channel = await bot.channels.fetch(channelId);
    await channel.send({
      content: `📢 **${title}**\n\n${content}`,
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to send Discord announcement:", err.message);
    return { error: err.message };
  }
}

/**
 * Initialize the bot (call on server startup).
 */
function initDiscordBot() {
  if (process.env.DISCORD_BOT_TOKEN) {
    getClient();
  }
}

module.exports = {
  initDiscordBot,
  createHackathonServer,
  createTeamChannel,
  sendAnnouncement,
};
