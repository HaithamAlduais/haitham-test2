/**
 * Ramsha — Email Service (Resend)
 *
 * Simple, reliable email delivery via Resend.com
 * Free tier: 3,000 emails/month, 100/day
 */

const { Resend } = require("resend");

let resend = null;

function getClient() {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY not set — email disabled.");
    return null;
  }
  resend = new Resend(key);
  return resend;
}

const FROM = process.env.RESEND_FROM || "Ramsha <onboarding@resend.dev>";

async function sendEmail({ to, subject, html, text }) {
  const client = getClient();
  if (!client) {
    console.log(`[Email SKIP] ${to} | ${subject}`);
    return { sent: false, reason: "Not configured." };
  }
  try {
    const { data, error } = await client.emails.send({ from: FROM, to, subject, html, text: text || subject });
    if (error) throw new Error(error.message);
    console.log(`[Email SENT] ${to} | ${subject}`);
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error(`[Email ERROR] ${to} | ${err.message}`);
    return { sent: false, reason: err.message };
  }
}

async function sendBulkEmail(messages) {
  let sent = 0;
  for (const m of messages) {
    const r = await sendEmail(m);
    if (r.sent) sent++;
  }
  return { sent: true, count: sent };
}

// ── Templates ──────────────────────────────────────────────────────────────

const T = {
  registration_confirmation: ({ participantName, hackathonTitle, hackathonUrl }) => ({
    subject: `Registration Confirmed — ${hackathonTitle}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#7C3AED">Registration Confirmed!</h2><p>Hi <b>${participantName}</b>,</p><p>Your registration for <b>${hackathonTitle}</b> has been received. We'll notify you once a decision is made.</p>${hackathonUrl ? `<p><a href="${hackathonUrl}" style="color:#7C3AED">View Hackathon</a></p>` : ""}<hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="color:#999;font-size:12px">Ramsha Platform</p></div>`,
  }),
  acceptance: ({ participantName, hackathonTitle, hackathonUrl, discordInviteUrl, starterKitResources }) => ({
    subject: `You're In! Welcome to ${hackathonTitle}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#22c55e">You've Been Accepted!</h2><p>Hi <b>${participantName}</b>,</p><p>Great news — you're in for <b>${hackathonTitle}</b>!</p><h3>Next Steps:</h3><ol><li>Form or join a team</li>${discordInviteUrl ? `<li><a href="${discordInviteUrl}" style="color:#7C3AED">Join Discord</a></li>` : ""}<li>Review resources & start building</li></ol>${starterKitResources?.length ? `<h3>Starter Kit:</h3><ul>${starterKitResources.map(r => `<li><a href="${r.url}">${r.title}</a></li>`).join("")}</ul>` : ""}${hackathonUrl ? `<p><a href="${hackathonUrl}" style="display:inline-block;padding:10px 20px;background:#7C3AED;color:white;text-decoration:none;border-radius:6px">Go to Hackathon</a></p>` : ""}<hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="color:#999;font-size:12px">Ramsha Platform</p></div>`,
  }),
  rejection: ({ participantName, hackathonTitle }) => ({
    subject: `Update on your ${hackathonTitle} application`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>Application Update</h2><p>Hi <b>${participantName}</b>,</p><p>Thank you for your interest in <b>${hackathonTitle}</b>. Unfortunately, we couldn't accept your application this time.</p><p>We encourage you to apply to future hackathons!</p><hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="color:#999;font-size:12px">Ramsha Platform</p></div>`,
  }),
  winner_notification: ({ participantName, hackathonTitle, prizeTitle, prizeValue }) => ({
    subject: `You Won! — ${hackathonTitle}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#FFD700">Congratulations, Winner!</h2><p>Hi <b>${participantName}</b>,</p><p>You've won <b>${prizeTitle}</b> at <b>${hackathonTitle}</b>!</p>${prizeValue ? `<p style="font-size:24px;font-weight:bold;color:#7C3AED">${prizeValue}</p>` : ""}<hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="color:#999;font-size:12px">Ramsha Platform</p></div>`,
  }),
  submission_reminder: ({ participantName, hackathonTitle, deadline, hackathonUrl }) => ({
    subject: `Deadline Approaching — ${hackathonTitle}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#ef4444">Deadline Reminder!</h2><p>Hi <b>${participantName}</b>,</p><p>Submission deadline for <b>${hackathonTitle}</b> is <b>${deadline}</b>.</p>${hackathonUrl ? `<p><a href="${hackathonUrl}" style="display:inline-block;padding:10px 20px;background:#7C3AED;color:white;text-decoration:none;border-radius:6px">Submit Now</a></p>` : ""}<hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="color:#999;font-size:12px">Ramsha Platform</p></div>`,
  }),
  judge_invitation: ({ judgeName, hackathonTitle, hackathonUrl }) => ({
    subject: `Judge Invitation — ${hackathonTitle}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#7C3AED">Judge Invitation</h2><p>Hi <b>${judgeName}</b>,</p><p>You've been invited to judge <b>${hackathonTitle}</b>.</p>${hackathonUrl ? `<p><a href="${hackathonUrl}" style="display:inline-block;padding:10px 20px;background:#7C3AED;color:white;text-decoration:none;border-radius:6px">Go to Judge Portal</a></p>` : ""}<hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="color:#999;font-size:12px">Ramsha Platform</p></div>`,
  }),
  post_event_survey: ({ participantName, hackathonTitle, surveyUrl }) => ({
    subject: `Share Your Feedback — ${hackathonTitle}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2 style="color:#7C3AED">How was your experience?</h2><p>Hi <b>${participantName}</b>,</p><p>Thank you for participating in <b>${hackathonTitle}</b>! We'd love your feedback.</p>${surveyUrl ? `<p><a href="${surveyUrl}" style="display:inline-block;padding:10px 20px;background:#7C3AED;color:white;text-decoration:none;border-radius:6px">Take Survey</a></p>` : ""}<hr style="border:none;border-top:1px solid #eee;margin:20px 0"><p style="color:#999;font-size:12px">Ramsha Platform</p></div>`,
  }),
};

async function sendTemplatedEmail(templateName, { to, data }) {
  const fn = T[templateName];
  if (!fn) return { sent: false, reason: "Unknown template." };
  const { subject, html } = fn(data);
  return sendEmail({ to, subject, html });
}

module.exports = { sendEmail, sendBulkEmail, sendTemplatedEmail, TEMPLATES: T };
