import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

// f_png = explicit format (deterministic URL → CDN always hits cache, no per-client format negotiation)
// q_auto = smart lossless PNG compression, w_480 = 2× retina cap, e_trim = strip built-in whitespace
const LOGO_URL = 'https://res.cloudinary.com/dpaungnqb/image/upload/e_trim,f_png,q_auto,w_480/v1776427263/brand/logo-full.png';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;

  constructor() {
    const key = process.env.RESEND_API_KEY?.trim();
    if (key) {
      this.resend = new Resend(key);
      this.logger.log('Resend email service initialised');
    } else {
      this.logger.warn('RESEND_API_KEY not set — emails will be skipped');
    }
  }

  private get from() {
    return (process.env.FROM_EMAIL ?? 'House9ja <support@updates.damco.space>').replace(/\s+/g, ' ').trim();
  }

  private get appUrl() {
    return (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  private layout(body: string) {
    const domain = this.appUrl.replace(/^https?:\/\//, '');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6f9;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;width:100%">

        <!-- LOGO HEADER -->
        <tr><td style="background:#ffffff;border-radius:16px 16px 0 0;padding:18px 32px 16px;text-align:center;border-bottom:1px solid #e8ecf0">
          <img src="${LOGO_URL}" alt="House9ja" height="52" style="height:52px;width:auto;display:block;margin:0 auto;border:0;line-height:1" />
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#ffffff;padding:36px 40px">
          ${body}
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #e8ecf0">
          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7">
            House9ja — Nigeria's trusted rental marketplace<br/>
            Questions? Reply to this email or visit
            <a href="${this.appUrl}" style="color:#2563eb;text-decoration:none">${domain}</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private btn(href: string, text: string) {
    return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0">
      <tr><td style="border-radius:10px;background:#2563eb">
        <a href="${href}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.01em">${text}</a>
      </td></tr>
    </table>`;
  }

  private divider() {
    return `<hr style="border:none;border-top:1px solid #e8ecf0;margin:24px 0"/>`;
  }

  // ── Public methods ────────────────────────────────────────────────────────

  async sendVerificationEmail(to: string, firstName: string, token: string) {
    const link = `${this.appUrl}/verify-email?token=${token}`;
    return this.send(to, 'Verify your House9ja email', this.layout(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb">Email Verification</p>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#0f172a;line-height:1.3">Welcome to House9ja, ${firstName}!</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7">
        You're almost there! Click the button below to verify your email address and unlock full access to Nigeria's trusted rental marketplace.
      </p>
      ${this.btn(link, 'Verify Email Address')}
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6">
        This link expires in <strong style="color:#64748b">24 hours</strong>. If you didn't create a House9ja account, you can safely ignore this email.
      </p>
      ${this.divider()}
      <p style="margin:0;font-size:12px;color:#cbd5e1;word-break:break-all">
        Or copy: <a href="${link}" style="color:#93c5fd;text-decoration:none">${link}</a>
      </p>
    `));
  }

  async sendNotificationEmail(to: string, _firstName: string, title: string, message: string, linkUrl?: string) {
    const cta = linkUrl ? this.btn(`${this.appUrl}${linkUrl}`, 'View Details') : '';
    return this.send(to, title, this.layout(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb">Notification</p>
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3">${title}</h1>
      <p style="margin:0;font-size:15px;color:#475569;line-height:1.7">${message}</p>
      ${cta}
    `));
  }

  async sendBroadcastEmail(to: string, _firstName: string, subject: string, message: string) {
    return this.send(to, subject, this.layout(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb">Platform Update</p>
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3">${subject}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;white-space:pre-wrap">${message}</p>
      ${this.divider()}
      <p style="margin:0;font-size:12px;color:#94a3b8">You're receiving this because you have an active House9ja account.</p>
    `));
  }

  async sendOtpEmail(to: string, firstName: string, otp: string) {
    return this.send(to, 'Your House9ja login code', this.layout(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#2563eb">Security Code</p>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#0f172a;line-height:1.3">Your login code</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7">
        Hi <strong>${firstName}</strong>, use the code below to complete your sign-in to House9ja.
      </p>
      <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#3b82f6">One-time code</p>
        <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:0.18em;color:#1e3a5f;font-family:monospace">${otp}</p>
      </div>
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.7">
        This code expires in <strong style="color:#64748b">10 minutes</strong> and can only be used once.<br/>
        If you didn't try to sign in, please <strong style="color:#64748b">change your password immediately</strong>.
      </p>
      ${this.divider()}
      <p style="margin:0;font-size:12px;color:#cbd5e1">Never share this code with anyone — House9ja staff will never ask for it.</p>
    `));
  }

  async sendPasswordResetEmail(to: string, firstName: string, token: string) {
    const link = `${this.appUrl}/reset-password?token=${token}`;
    return this.send(to, 'Reset your House9ja password', this.layout(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#dc2626">Password Reset</p>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#0f172a;line-height:1.3">Reset your password</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7">
        Hi <strong>${firstName}</strong>, we received a request to reset your House9ja password. Click the button below to choose a new one.
      </p>
      ${this.btn(link, 'Reset Password')}
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.7">
        This link expires in <strong style="color:#64748b">1 hour</strong>.<br/>
        If you didn't request a password reset, you can safely ignore this email — your account is secure.
      </p>
      ${this.divider()}
      <p style="margin:0;font-size:12px;color:#cbd5e1;word-break:break-all">
        Or copy: <a href="${link}" style="color:#93c5fd;text-decoration:none">${link}</a>
      </p>
    `));
  }

  async sendMoreDocsEmail(to: string, firstName: string, adminMessage: string) {
    return this.send(to, 'Action Required: Additional Documents Needed', this.layout(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#d97706">Action Required</p>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3">Additional Documents Needed</h1>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7">
        Hi <strong>${firstName}</strong>, our verification team has reviewed your submission and needs a bit more information:
      </p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0;font-size:14px;color:#92400e;line-height:1.7">${adminMessage}</p>
      </div>
      ${this.btn(`${this.appUrl}/verify`, 'Upload Documents Now')}
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6">
        Please resubmit as soon as possible to complete your verification and unlock all platform features.
      </p>
    `));
  }

  // ── Core ──────────────────────────────────────────────────────────────────

  async send(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
    if (!this.resend) {
      this.logger.warn(`[EMAIL SKIPPED] No API key. "${subject}" → ${to}`);
      return { ok: false, error: 'RESEND_API_KEY not configured' };
    }
    try {
      const { data, error } = await this.resend.emails.send({ from: this.from, to, subject, html });
      if (error) {
        this.logger.error(`[EMAIL ERROR] "${subject}" → ${to} | ${JSON.stringify(error)}`);
        return { ok: false, error: error.message };
      }
      this.logger.log(`[EMAIL SENT] id=${data?.id} | "${subject}" → ${to}`);
      return { ok: true };
    } catch (err: any) {
      this.logger.error(`[EMAIL EXCEPTION] "${subject}" → ${to} | ${err?.message}`);
      return { ok: false, error: err?.message ?? 'Unknown error' };
    }
  }
}
