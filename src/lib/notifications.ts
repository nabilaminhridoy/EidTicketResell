import { prisma } from "./prisma";
import { Resend } from "resend";
import nodemailer from "nodemailer";

// Hybrid Email System Configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@eidticketresell.com";

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Determine Primary Mode
const EMAIL_MODE: "RESEND" | "SMTP" | "DISABLED" = 
    RESEND_API_KEY ? "RESEND" : (SMTP_HOST && SMTP_USER ? "SMTP" : "DISABLED");

// Lazy-load NodeMailer Transporter
let transporter: nodemailer.Transporter | null = null;
if (EMAIL_MODE === "SMTP") {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/**
 * 📧 Asynchronous Hybrid Email Dispatcher
 */
export async function sendEmail(to: string, subject: string, htmlBody: string) {
  try {
    if (EMAIL_MODE === "RESEND" && resend) {
      await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject,
        html: htmlBody,
      });
      return true;
    } else if (EMAIL_MODE === "SMTP" && transporter) {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        subject,
        html: htmlBody,
      });
      return true;
    } else {
      console.warn(`[NOTIFICATIONS:EMAIL_BLOCKED] Missing Transport Configs. Would send to ${to}. Subject: ${subject}`);
      return false; // Silently fail without breaking the API route loop
    }
  } catch (error) {
    console.error("[NOTIFICATIONS:EMAIL_ERROR] Failed to send email:", error);
    return false;
  }
}

/**
 * 📱 Vendor-Agnostic SMS Dispatcher
 */
export async function sendSMS(phone: string, message: string) {
  try {
    const smsGatewayUrl = process.env.SMS_GATEWAY_URL;
    const smsApiKey = process.env.SMS_API_KEY;

    if (!smsGatewayUrl || !smsApiKey) {
      console.warn(`[NOTIFICATIONS:SMS_BLOCKED] Missing SMS Configs. Would send to ${phone}. Message: ${message}`);
      return false;
    }

    // Example Standard Integration Hook, can map to Bulksmsbd etc.
    const response = await fetch(smsGatewayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: smsApiKey, to: phone, msg: message })
    });

    return response.ok;
  } catch (error) {
    console.error("[NOTIFICATIONS:SMS_ERROR] Failed to send SMS:", error);
    return false;
  }
}

/**
 * 🔔 Primary Omnichannel Abstraction Engine
 * Triggers In-App Notification (Database) ALWAYS, and automatically
 * tries to retrieve Email/SMS Templates based on the type hook to disperse asynchronously.
 */
export async function broadcastNotification({
  userId,
  type,
  title,
  message,
  link,
  sendEmailAlert = false,
  sendSmsAlert = false
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  sendEmailAlert?: boolean;
  sendSmsAlert?: boolean;
}) {
  try {
    // 1. Immutable In-App DB Storage (Always Priority)
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link
      }
    });

    // Extract User Contact details for outbound hooks if requested
    if (sendEmailAlert || sendSmsAlert) {
       const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, phone: true } });
       if (!user) return; // Ghost user

       // Fire and Forget (Do NOT await internally or it will block parent thread)
       if (sendEmailAlert) {
          sendEmail(user.email, title, `<div style="font-family:sans-serif;"><h3>${title}</h3><p>${message}</p></div>`).catch(console.error);
       }
       if (sendSmsAlert) {
          sendSMS(user.phone, message).catch(console.error);
       }
    }
  } catch (e) {
    console.error("[NOTIFICATIONS:BROADCAST_ERROR] Ledger insertion failed.", e);
  }
}
