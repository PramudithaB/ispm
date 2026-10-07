import { Router } from 'express';
import {
  login,
  register,
  logout,
  getMe,
  updateProfile,
  verifyEmail,
  resendVerification,
  forgotPassword, 
  resetPassword,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { loginRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public Authentication Endpoints
router.post('/register', loginRateLimiter, register);
router.post('/login', loginRateLimiter, login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', loginRateLimiter, resendVerification);
router.post('/forgot-password', loginRateLimiter, forgotPassword);
router.post('/reset-password', loginRateLimiter, resetPassword);

// Authenticated Endpoints
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);

export default router;
