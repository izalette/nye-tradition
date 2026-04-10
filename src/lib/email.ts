import { getPublicBaseUrl } from "./base-url";

type SendResult = { ok: true } | { ok: false; reason: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
}

async function sendViaResend(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!key || !from) {
    return { ok: false, reason: "not_configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[email] Resend error", res.status, text);
    return { ok: false, reason: "resend_api" };
  }
  return { ok: true };
}

export async function sendJoinConfirmationEmail(options: {
  to: string;
  eventTitle: string;
  slug: string;
  secretToken: string;
}): Promise<SendResult> {
  if (!isEmailConfigured()) return { ok: false, reason: "not_configured" };

  const base = getPublicBaseUrl();
  const link = `${base}/e/${options.slug}/me/${options.secretToken}`;
  const title = escapeHtml(options.eventTitle);

  return sendViaResend({
    to: options.to,
    subject: `You joined: ${options.eventTitle}`,
    html: `
      <p>Hi,</p>
      <p>You signed up for <strong>${title}</strong>.</p>
      <p>Your private assignments page (bookmark this):</p>
      <p><a href="${link}">${escapeHtml(link)}</a></p>
      <p>Do not share this link — it is only for you.</p>
    `,
  });
}

export async function sendDrawReadyEmail(options: {
  to: string;
  eventTitle: string;
  slug: string;
  secretToken: string;
}): Promise<SendResult> {
  if (!isEmailConfigured()) return { ok: false, reason: "not_configured" };

  const base = getPublicBaseUrl();
  const link = `${base}/e/${options.slug}/me/${options.secretToken}`;
  const title = escapeHtml(options.eventTitle);

  return sendViaResend({
    to: options.to,
    subject: `Assignments are ready: ${options.eventTitle}`,
    html: `
      <p>Hi,</p>
      <p>The draw for <strong>${title}</strong> has been run.</p>
      <p>Open your private page to see secret friend, secret enemy, and cooking partner:</p>
      <p><a href="${link}">${escapeHtml(link)}</a></p>
    `,
  });
}
