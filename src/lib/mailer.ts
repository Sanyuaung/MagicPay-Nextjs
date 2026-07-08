import nodemailer from "nodemailer";

const MAIL_HOST = process.env.MAIL_HOST;
const MAIL_PORT = Number(process.env.MAIL_PORT || 587);
const MAIL_USERNAME = process.env.MAIL_USERNAME;
const MAIL_PASSWORD = process.env.MAIL_PASSWORD;
const MAIL_ENCRYPTION = (process.env.MAIL_ENCRYPTION || "tls").toLowerCase();
const MAIL_FROM_ADDRESS =
  process.env.MAIL_FROM_ADDRESS ||
  process.env.MAIL_USERNAME ||
  "noreply@localhost";
const MAIL_FROM_NAME =
  process.env.MAIL_FROM_NAME || process.env.APP_NAME || "MagicPay";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!MAIL_HOST || !MAIL_USERNAME || !MAIL_PASSWORD) {
    throw new Error("Mail server is not configured.");
  }

  transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: MAIL_ENCRYPTION === "ssl",
    requireTLS: MAIL_ENCRYPTION === "tls",
    auth: {
      user: MAIL_USERNAME,
      pass: MAIL_PASSWORD,
    },
  });

  return transporter;
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetUrl: string,
  requestedEmail: string,
) {
  const resolvedToEmail = process.env.MAIL_TO_ADDRESS || toEmail;
  const appName = process.env.APP_NAME || "MagicPay";

  const mailer = getTransporter();
  await mailer.sendMail({
    from: `"${MAIL_FROM_NAME}" <${MAIL_FROM_ADDRESS}>`,
    to: resolvedToEmail,
    subject: `${appName} Password Reset Request`,
    text: `You are receiving this email because we received a password reset request for your account (${requestedEmail}).\n\nOpen this link to reset your password:\n${resetUrl}\n\nThis password reset link will expire in 60 minutes.\n\nIf you did not request a password reset, no further action is required.`,
    html: [
      '<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;">',
      `<h2 style=\"margin:0 0 12px;\">${appName} Password Reset Request</h2>`,
      `<p style=\"margin:0 0 10px;\">We received a password reset request for <strong>${requestedEmail}</strong>.</p>`,
      `<p style=\"margin:0 0 16px;\"><a href=\"${resetUrl}\" style=\"display:inline-block;background:#02aa9e;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;\">Reset Password</a></p>`,
      `<p style=\"margin:0 0 10px;\">Or open this URL directly:<br><a href=\"${resetUrl}\">${resetUrl}</a></p>`,
      '<p style="margin:0;">This link expires in 60 minutes. If you did not request this, you can ignore this email.</p>',
      "</div>",
    ].join(""),
  });
}
