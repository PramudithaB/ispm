import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Ensure dotenv is loaded before creating the transporter
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { config } from '../config/env';

// Initialize Nodemailer transporter with Gmail SMTP
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'securehemasservice@gmail.com',
    pass: process.env.EMAIL_PASSWORD || '',
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

// Safe SMTP connection verification (development startup check)
export const verifyEmailConfiguration = async (): Promise<boolean> => {
  if (!config.email.password) {
    console.log('ℹ️  Email service: EMAIL_PASSWORD not set in server/.env (emails will be logged to console in dev mode).');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ Email service configured successfully (Gmail SMTP verified)');
    return true;
  } catch (error: any) {
    // Only log error message without sensitive credentials
    const safeErrorMsg = error?.message ? error.message.replace(/: [^ ]+@/, ': ***@') : 'Unknown error';
    console.warn(`⚠️  Email service configuration failed: ${safeErrorMsg}`);
    console.warn('   Please ensure a valid 16-character Gmail App Password is set in server/.env for EMAIL_PASSWORD.');
    return false;
  }
};

// Common branded email layout generator
const generateEmailTemplate = ({
  title,
  preheader,
  contentHtml,
  buttonText,
  buttonUrl,
  footerNote,
}: {
  title: string;
  preheader: string;
  contentHtml: string;
  buttonText?: string;
  buttonUrl?: string;
  footerNote?: string;
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; }
    .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: #0284c7; border-radius: 12px; margin-bottom: 12px; color: #ffffff; font-size: 22px; font-weight: bold; }
    .brand-title { color: #ffffff; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
    .brand-subtitle { color: #94a3b8; font-size: 11px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
    .body-content { padding: 32px 28px; line-height: 1.6; font-size: 14px; }
    .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-weight: 700; font-size: 13px; letter-spacing: 0.2px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25); }
    .btn:hover { background: #0369a1; }
    .url-fallback { background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 11px; color: #475569; word-break: break-all; margin-top: 20px; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .security-notice { border-left: 3px solid #0284c7; padding-left: 12px; margin: 20px 0; color: #475569; font-size: 12px; }
  </style>
</head>
<body>
  <div style="display:none; font-size:1px; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
    ${preheader}
  </div>
  <div class="container">
    <div class="header">
      <div class="logo-badge">🛡️</div>
      <h1 class="brand-title">SecureHemas</h1>
      <p class="brand-subtitle">Information Security & Compliance Management</p>
    </div>
    <div class="body-content">
      ${contentHtml}
      ${buttonText && buttonUrl ? `
        <div class="btn-container">
          <a href="${buttonUrl}" class="btn" target="_blank">${buttonText}</a>
        </div>
        <div class="url-fallback">
          If the button does not work, copy and paste this link into your browser:<br>
          <a href="${buttonUrl}" style="color: #0284c7;">${buttonUrl}</a>
        </div>
      ` : ''}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>Hemas Hospitals Information Technology & Cyber Defense</strong></p>
      <p style="margin: 0;">${footerNote || 'This is an automated system email. Please do not reply directly to this message.'}</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Generic mail sender with automatic fallback if credentials are unset in local test
const sendMail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> => {
  try {
    if (process.env.NODE_ENV !== 'test' && process.env.EMAIL_PASSWORD) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || config.email.from,
          to,
          subject,
          html,
          text: text || subject,
        });
        console.log(`✉️ Real Gmail SMTP email dispatched to ${to} [Subject: "${subject}"]`);
        return true;
      } catch (smtpError: any) {
        console.error(`❌ Gmail SMTP sending failed to ${to}:`, smtpError?.message || smtpError);
        console.warn('   Note: Gmail rejected SMTP credentials. A Gmail App Password is required.');
        return false;
      }
    } else {
      console.log(`\n================== [EMAIL SERVICE (LOCAL SIMULATION)] ==================`);
      console.log(`FROM: ${process.env.EMAIL_FROM || config.email.from}`);
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`========================================================================\n`);
      return true;
    }
  } catch (error: any) {
    console.error(`❌ Email processing error:`, error?.message || error);
    return false;
  }
};

// 1. Staff Registration Email Verification
export const sendVerificationEmail = async (
  to: string,
  fullName: string,
  verificationUrl: string
): Promise<boolean> => {
  const subject = 'Verify Your SecureHemas Account';
  const preheader = 'Please verify your hospital email address to complete your SecureHemas registration.';

  const contentHtml = `
    <div class="greeting">Dear ${fullName},</div>
    <p>Thank you for registering for the <strong>SecureHemas</strong> Information Security Policy Awareness & Compliance Management System.</p>
    <p>To verify that this email address belongs to you and proceed with your registration, please click the verification button below:</p>
    <div class="security-notice">
      <strong>Verification Notice:</strong> This verification link will expire in 24 hours. After your email is verified, your account will be reviewed by the hospital administrator before activation.
    </div>
  `;

  console.log(`\n🔗 [VERIFICATION LINK]: ${verificationUrl}\n`);

  return sendMail({
    to,
    subject,
    html: generateEmailTemplate({
      title: subject,
      preheader,
      contentHtml,
      buttonText: 'Verify Email Address',
      buttonUrl: verificationUrl,
      footerNote: 'If you did not register for a SecureHemas staff account, please report this to IT Security.',
    }),
  });
};

// 2. Forgot Password Reset Email
export const sendPasswordResetEmail = async (
  to: string,
  fullName: string,
  resetUrl: string
): Promise<boolean> => {
  const subject = 'Reset Your SecureHemas Password';
  const preheader = 'Password reset request for your SecureHemas account.';

  const contentHtml = `
    <div class="greeting">Dear ${fullName || 'Staff Member'},</div>
    <p>We received a request to reset the password for your SecureHemas account registered under <strong>${to}</strong>.</p>
    <p>Click the button below to choose a new, secure password:</p>
    <div class="security-notice">
      <strong>Security Warning:</strong> This single-use password reset link is valid for 1 hour only. If you did not request a password reset, you can safely ignore this email; your existing password will remain secure.
    </div>
  `;

  console.log(`\n🔗 [PASSWORD RESET LINK]: ${resetUrl}\n`);

  return sendMail({
    to,
    subject,
    html: generateEmailTemplate({
      title: subject,
      preheader,
      contentHtml,
      buttonText: 'Reset Password',
      buttonUrl: resetUrl,
      footerNote: 'For security reasons, never share this reset link with anyone, including hospital IT staff.',
    }),
  });
};

// 3. Admin Account Approved Notification
export const sendAccountApprovedEmail = async (
  to: string,
  fullName: string,
  loginUrl: string
): Promise<boolean> => {
  const subject = 'Your SecureHemas Account Has Been Approved';
  const preheader = 'Your SecureHemas staff account has been approved by the administrator.';

  const contentHtml = `
    <div class="greeting">Dear ${fullName},</div>
    <p>Your staff registration for the <strong>SecureHemas</strong> system has been reviewed and <strong style="color: #10b981;">approved</strong> by the hospital administrator.</p>
    <p>Your account is now <strong>Active</strong>. You can sign in using your registered credentials to review mandatory security policies, acknowledge guidelines, and participate in security awareness training.</p>
  `;

  return sendMail({
    to,
    subject,
    html: generateEmailTemplate({
      title: subject,
      preheader,
      contentHtml,
      buttonText: 'Sign In to SecureHemas',
      buttonUrl: loginUrl,
      footerNote: 'Welcome to Hemas Hospitals Information Security & Compliance Management.',
    }),
  });
};

// 4. Admin Account Rejected Notification
export const sendAccountRejectedEmail = async (
  to: string,
  fullName: string,
  reason?: string
): Promise<boolean> => {
  const subject = 'SecureHemas Account Registration Update';
  const preheader = 'Update regarding your SecureHemas staff account registration.';

  const contentHtml = `
    <div class="greeting">Dear ${fullName},</div>
    <p>Your staff registration for the <strong>SecureHemas</strong> system has been reviewed by the hospital administrator and could not be approved at this time.</p>
    ${reason ? `<div class="security-notice"><strong>Reason provided:</strong> ${reason}</div>` : ''}
    <p>If you believe this decision was made in error or if your employee credentials require updating, please contact your Department Head or the Hospital IT Security Helpdesk.</p>
  `;

  return sendMail({
    to,
    subject,
    html: generateEmailTemplate({
      title: subject,
      preheader,
      contentHtml,
      footerNote: 'For inquiries, contact the Hemas Hospital IT Helpdesk.',
    }),
  });
};

// 5. Development Test Email
export const sendTestEmail = async (
  to: string
): Promise<{ success: boolean; message: string; error?: string; code?: string }> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'SecureHemas <securehemasservice@gmail.com>',
      to,
      subject: 'SecureHemas Email Test',
      text: 'SecureHemas email service is working successfully.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #0284c7;">SecureHemas Email Test</h2>
          <p>SecureHemas email service is working successfully.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">Hemas Hospitals Information Security & Compliance Management</p>
        </div>
      `,
    });
    console.log(`✉️ Test email dispatched successfully to ${to}`);
    return {
      success: true,
      message: 'Test email sent successfully',
    };
  } catch (error: any) {
    console.error('Email sending failed:', error?.message || error);
    return {
      success: false,
      message: 'Failed to send test email',
      error: error?.message || 'Unknown SMTP error',
      code: error?.code,
    };
  }
};

