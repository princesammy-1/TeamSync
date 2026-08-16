/**
 * Pluggable outbound email.
 *
 * Configure a real provider via environment variables. When no provider is
 * configured, messages are logged to the console instead so local dev and
 * the test suite can run without an SMTP account.
 *
 * Providers:
 *  - Resend:  EMAIL_PROVIDER=resend, RESEND_API_KEY, EMAIL_FROM
 *  - Mailgun: EMAIL_PROVIDER=mailgun, MAILGUN_API_KEY, MAILGUN_DOMAIN, EMAIL_FROM
 *  - SMTP:    EMAIL_PROVIDER=smtp, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 */

import { createLogger } from "./logger.js";

const logger = createLogger();

export function getEmailProvider() {
  return String(process.env.EMAIL_PROVIDER ?? "").trim().toLowerCase();
}

export function isEmailConfigured() {
  return Boolean(getEmailProvider());
}

function buildHeaders() {
  const token = process.env.RESEND_API_KEY;
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function sendViaResend({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || "TeamSync <noreply@teamsync.app>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend delivery failed (${response.status}): ${body}`);
  }

  return response.json();
}

async function sendViaMailgun({ to, subject, html, text }) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.EMAIL_FROM || "TeamSync <noreply@teamsync.app>";

  const body = new URLSearchParams({
    from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  });

  const response = await fetch(
    `https://api.mailgun.net/v3/${domain}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      },
      body,
    },
  );

  if (!response.ok) {
    throw new Error(`Mailgun delivery failed (${response.status})`);
  }

  return response.json();
}

async function sendViaSmtp({ to, subject, html, text }) {
  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transport.sendMail({
    from: process.env.EMAIL_FROM || "TeamSync <noreply@teamsync.app>",
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  });
}

export async function sendEmail({ to, subject, html, text }) {
  const provider = getEmailProvider();

  if (!provider) {
    logger.info("Email not configured; logging message instead", {
      to,
      subject,
    });
    return { ok: true, delivered: false, provider: "console" };
  }

  const payload = { to, subject, html, text };
  switch (provider) {
    case "resend":
      return { ok: true, provider, result: await sendViaResend(payload) };
    case "mailgun":
      return { ok: true, provider, result: await sendViaMailgun(payload) };
    case "smtp":
      return { ok: true, provider, result: await sendViaSmtp(payload) };
    default:
      throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);
  }
}

export function appBaseUrl() {
  return (
    process.env.TEAMSYNC_APP_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:4173"
  );
}

export function inviteEmailHtml({ inviteeName, workspaceName, acceptUrl }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1f2937;">You're invited to ${workspaceName}</h2>
      <p style="color: #4b5563;">Hi ${inviteeName},</p>
      <p style="color: #4b5563;">
        ${workspaceName} is collaborating on TeamSync and would love for you to join.
        Click below to accept your invitation and get started.
      </p>
      <p>
        <a href="${acceptUrl}"
           style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Accept invitation
        </a>
      </p>
      <p style="color: #9ca3af; font-size: 12px;">This link expires in 7 days. If you weren't expecting this, you can ignore it.</p>
    </div>
  `;
}

export function passwordResetEmailHtml({ name, resetUrl, expiresIn = "30 minutes" }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1f2937;">Reset your TeamSync password</h2>
      <p style="color: #4b5563;">Hi ${name},</p>
      <p style="color: #4b5563;">We received a request to reset your password. Click below to choose a new one.</p>
      <p>
        <a href="${resetUrl}"
           style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Reset password
        </a>
      </p>
      <p style="color: #9ca3af; font-size: 12px;">This link expires in ${expiresIn}. If you didn't request this, you can safely ignore it.</p>
    </div>
  `;
}

/**
 * Per-recipient rate limiter for outbound email. Prevents a single address
 * from being flooded with messages (e.g. repeated invite or reset spam).
 */
export function createEmailRateLimiter(windowMs = 60_000, maxPerRecipient = 3) {
  const sent = new Map();

  return function emailRateLimiter(req, res, next) {
    const recipient = String(req.body?.email ?? "").trim().toLowerCase();
    if (!recipient) return next();

    const now = Date.now();
    const hits = (sent.get(recipient) || []).filter((time) => time > now - windowMs);

    if (hits.length >= maxPerRecipient) {
      return res.status(429).json({
        message: "Too many emails sent. Please try again later.",
      });
    }

    hits.push(now);
    sent.set(recipient, hits);
    return next();
  };
}