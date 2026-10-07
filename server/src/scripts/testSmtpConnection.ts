import dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';

// STEP 1: Load environment
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('==================================================');
console.log('STEP 1 – ENVIRONMENT CHECK');
console.log('==================================================');
console.log('EMAIL_USER configured:', Boolean(process.env.EMAIL_USER));
console.log('EMAIL_USER value:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD configured:', Boolean(process.env.EMAIL_PASSWORD));
console.log('EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0);
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com');
console.log('SMTP_PORT:', process.env.SMTP_PORT || 587);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE || false);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || process.env.CLIENT_URL);
console.log('==================================================\n');

// STEP 2: Configure Transporter
console.log('==================================================');
console.log('STEP 2 – NODEMAILER TRANSPORTER INITIALIZATION');
console.log('==================================================');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
console.log('Transporter initialized.');
console.log('==================================================\n');

// STEP 3: Verify SMTP Connection
console.log('==================================================');
console.log('STEP 3 – VERIFY SMTP CONNECTION');
console.log('==================================================');

async function testConnection() {
  try {
    await transporter.verify();
    console.log('✅ SMTP verification succeeded: Gmail connection authenticated!');
    
    // STEP 4: Test Sending
    console.log('\nTesting sendMail to', process.env.EMAIL_USER, '...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `SecureHemas <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER!,
      subject: 'SecureHemas Email Test',
      text: 'SecureHemas email service is working successfully.',
    });
    console.log('✅ Test email sent successfully! Message ID:', info.messageId);
  } catch (error: any) {
    console.error('SMTP verification failed:');
    console.error(error.message);
    if (error.code) {
      console.error('Nodemailer Error Code:', error.code);
    }
    if (error.response) {
      console.error('Nodemailer Error Response:', error.response);
    }
    if (error.responseCode) {
      console.error('SMTP Response Code:', error.responseCode);
    }
  }
}

testConnection();
