import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db.js';
import { comparePassword, hashPassword } from '../utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import {
  validateBody,
  loginSchema,
  signupSchema,
  verifyEmailSchema,
  resendOtpSchema,
} from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { generateOtp, getOtpExpiry } from '../utils/otp.js';
import { sendOtpEmail } from '../utils/email.js';
import { config } from '../config/env.js';

const router = Router();
const googleClient = new OAuth2Client(config.googleClientId);

router.post('/signup', validateBody(signupSchema), async (req, res) => {
  const { email, password, firstName, lastName, country, phone } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const passwordHash = await hashPassword(password);
  const otp = generateOtp();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      country: country ?? '',
      phone: phone ?? '',
      isVerified: false,
      emailOtp: otp,
      emailOtpExpiresAt: getOtpExpiry(10),
    },
  });

  try {
    await sendOtpEmail(user.email, otp);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
  }

  // No tokens yet — account is unverified until the OTP is confirmed.
  return res.status(201).json({
    message: 'Account created. Enter the verification code sent to your email.',
    email: user.email,
    requiresVerification: true,
  });
});

router.post('/verify-email', validateBody(verifyEmailSchema), async (req, res) => {
  const { email, code } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: 'Account not found' });
  }

  if (user.isVerified) {
    return res.status(400).json({ error: 'Account is already verified' });
  }

  if (!user.emailOtp || !user.emailOtpExpiresAt) {
    return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
  }

  if (user.emailOtpExpiresAt < new Date()) {
    return res.status(400).json({ error: 'This code has expired. Please request a new one.' });
  }

  if (user.emailOtp !== code) {
    return res.status(400).json({ error: 'Incorrect verification code.' });
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      emailOtp: null,
      emailOtpExpiresAt: null,
    },
  });

  const accessToken = signAccessToken({ id: verifiedUser.id, email: verifiedUser.email, role: verifiedUser.role });
  const refreshToken = signRefreshToken({ id: verifiedUser.id, email: verifiedUser.email, role: verifiedUser.role });

  await prisma.session.create({
    data: {
      userId: verifiedUser.id,
      refreshTokenHash: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  return res.json({
    user: {
      id: verifiedUser.id,
      email: verifiedUser.email,
      firstName: verifiedUser.firstName,
      lastName: verifiedUser.lastName,
      role: verifiedUser.role,
    },
    accessToken,
    refreshToken,
  });
});

router.post('/resend-otp', validateBody(resendOtpSchema), async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: 'Account not found' });
  }

  if (user.isVerified) {
    return res.status(400).json({ error: 'Account is already verified' });
  }

  const otp = generateOtp();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailOtp: otp,
      emailOtpExpiresAt: getOtpExpiry(10),
    },
  });

  try {
    await sendOtpEmail(user.email, otp);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return res.status(500).json({ error: 'Failed to send verification email' });
  }

  return res.json({ message: 'A new verification code has been sent.' });
});

router.post('/login', validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!user.passwordHash) {
    return res.status(401).json({ error: 'This account uses Google Sign-In. Please continue with Google instead.' });
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!user.isVerified) {
    // Automatically send a fresh code so the user isn't stuck.
    const otp = generateOtp();
    await prisma.user.update({
      where: { id: user.id },
      data: { emailOtp: otp, emailOtpExpiresAt: getOtpExpiry(10) },
    });
    try {
      await sendOtpEmail(user.email, otp);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
    }
    return res.status(403).json({
      error: 'Please verify your email to continue.',
      requiresVerification: true,
      email: user.email,
    });
  }

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id, email: user.email, role: user.role });

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
});

router.get('/google-client-id', (_req, res) => {
  return res.json({ clientId: config.googleClientId });
});

router.post('/google', async (req, res) => {
  const { credential } = req.body ?? {};

  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required' });
  }

  if (!config.googleClientId) {
    return res.status(400).json({ error: 'Google Sign-In isn\'t configured yet.' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid Google credential' });
  }

  if (!payload || !payload.email) {
    return res.status(401).json({ error: 'Could not read Google account details' });
  }

  let user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: payload.email,
        passwordHash: null,
        authProvider: 'google',
        firstName: payload.given_name || 'Trader',
        lastName: payload.family_name || '',
        // Google has already verified this email address for us.
        isVerified: true,
      },
    });
  }

  const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ id: user.id, email: user.email, role: user.role });

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body ?? {};

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const session = await prisma.session.findFirst({
      where: {
        userId: payload.id,
        refreshTokenHash: refreshToken,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const accessToken = signAccessToken({ id: payload.id, email: payload.email, role: payload.role });
    return res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      country: true,
      phone: true,
      role: true,
      isVerified: true,
      isActive: true,
    },
  });

  return res.json({ user });
});

export default router;