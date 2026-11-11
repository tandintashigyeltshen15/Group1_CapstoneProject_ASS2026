// backend/lib/mailer.js
// Sends email through SMTP (for example Gmail with an app password).
// If the SMTP settings are missing, the message is printed in the terminal instead,
// so you can still test flows like password reset without a mail account.

const nodemailer = require("nodemailer");

const configured = () => process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 465 uses TLS straight away, 587 upgrades after connecting
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

exports.sendMail = async ({ to, subject, text, html }) => {
  if (!configured()) {
    console.log("\n[mail not configured] Would have sent:");
    console.log(`To: ${to}\nSubject: ${subject}\n${text}\n`);
    return { sent: false };
  }

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
  return { sent: true };
};