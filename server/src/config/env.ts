import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'mysql://root@localhost:3306/ispm',
  jwtSecret: process.env.JWT_SECRET || 'securehemas_jwt_super_secret_key_2026_clinical_defense_secure',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'securehemas_jwt_refresh_super_secret_key_2026_clinical_defense_secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  clientUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  email: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER || 'securehemasservice@gmail.com',
    password: process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'SecureHemas <securehemasservice@gmail.com>',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.EMAIL_USER || process.env.SMTP_USER || 'securehemasservice@gmail.com',
    pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'SecureHemas <securehemasservice@gmail.com>',
  },
};
