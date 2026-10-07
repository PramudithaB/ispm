import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import nodemailer from 'nodemailer';

console.log('==================================================');
console.log('STEP 11 – COMPREHENSIVE EMAIL SYSTEM VERIFICATION');
console.log('==================================================');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

async function runAllTests() {
  const recipient = process.env.EMAIL_USER || 'securehemasservice@gmail.com';
  const sender = process.env.EMAIL_FROM || `SecureHemas <${process.env.EMAIL_USER}>`;

  // A. SMTP transporter.verify()
  console.log('\n--- A. SMTP transporter.verify() ---');
  let smtpStatus = 'FAILED';
  let smtpError = '';
  try {
    await transporter.verify();
    smtpStatus = 'SUCCESS';
    console.log('A. SMTP transporter.verify(): SUCCESS');
  } catch (err: any) {
    smtpStatus = 'FAILED';
    smtpError = err.message;
    console.log('A. SMTP transporter.verify(): FAILED -', err.message);
  }

  // B. Real test email
  console.log('\n--- B. Real Test Email ---');
  let testEmailStatus = 'FAILED';
  let testEmailError = '';
  try {
    const info = await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: 'SecureHemas Email Test',
      text: 'SecureHemas email service is working successfully.',
    });
    testEmailStatus = 'SUCCESS';
    console.log('B. Real test email: SUCCESS - Message ID:', info.messageId);
  } catch (err: any) {
    testEmailStatus = 'FAILED';
    testEmailError = err.message;
    console.log('B. Real test email: FAILED -', err.message);
  }

  // C. Staff verification email
  console.log('\n--- C. Staff Verification Email ---');
  let verificationStatus = 'FAILED';
  let verificationError = '';
  try {
    const info = await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: 'Verify Your SecureHemas Account',
      html: '<h2>Verify Your SecureHemas Account</h2><p>Please click here to verify: http://localhost:5173/verify-email?token=test_token_123</p>',
    });
    verificationStatus = 'SUCCESS';
    console.log('C. Staff verification email: SUCCESS - Message ID:', info.messageId);
  } catch (err: any) {
    verificationStatus = 'FAILED';
    verificationError = err.message;
    console.log('C. Staff verification email: FAILED -', err.message);
  }

  // D. Password reset email
  console.log('\n--- D. Password Reset Email ---');
  let resetStatus = 'FAILED';
  let resetError = '';
  try {
    const info = await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: 'Reset Your SecureHemas Password',
      html: '<h2>Reset Your Password</h2><p>Please click here to reset: http://localhost:5173/reset-password?token=test_reset_123</p>',
    });
    resetStatus = 'SUCCESS';
    console.log('D. Password reset email: SUCCESS - Message ID:', info.messageId);
  } catch (err: any) {
    resetStatus = 'FAILED';
    resetError = err.message;
    console.log('D. Password reset email: FAILED -', err.message);
  }

  // E. Approval email
  console.log('\n--- E. Admin Approval Email ---');
  let approvalStatus = 'FAILED';
  let approvalError = '';
  try {
    const info = await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: 'Your SecureHemas Account Has Been Approved',
      html: '<h2>Account Approved</h2><p>Your account is now active: http://localhost:5173/login</p>',
    });
    approvalStatus = 'SUCCESS';
    console.log('E. Approval email: SUCCESS - Message ID:', info.messageId);
  } catch (err: any) {
    approvalStatus = 'FAILED';
    approvalError = err.message;
    console.log('E. Approval email: FAILED -', err.message);
  }

  // F. Rejection email
  console.log('\n--- F. Admin Rejection Email ---');
  let rejectionStatus = 'FAILED';
  let rejectionError = '';
  try {
    const info = await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: 'SecureHemas Account Registration Update',
      html: '<h2>Registration Update</h2><p>Your registration was not approved.</p>',
    });
    rejectionStatus = 'SUCCESS';
    console.log('F. Rejection email: SUCCESS - Message ID:', info.messageId);
  } catch (err: any) {
    rejectionStatus = 'FAILED';
    rejectionError = err.message;
    console.log('F. Rejection email: FAILED -', err.message);
  }

  console.log('\n==================================================');
  console.log('FINAL SUMMARY');
  console.log('==================================================');
  console.log('SMTP STATUS:', smtpStatus, smtpError ? `(${smtpError})` : '');
  console.log('TEST EMAIL:', testEmailStatus, testEmailError ? `(${testEmailError})` : '');
  console.log('REGISTRATION EMAIL:', verificationStatus, verificationError ? `(${verificationError})` : '');
  console.log('PASSWORD RESET:', resetStatus, resetError ? `(${resetError})` : '');
  console.log('APPROVAL EMAIL:', approvalStatus, approvalError ? `(${approvalError})` : '');
  console.log('REJECTION EMAIL:', rejectionStatus, rejectionError ? `(${rejectionError})` : '');
}

runAllTests();
