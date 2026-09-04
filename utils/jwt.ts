import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function signAccessToken(payload: { id: string; email: string; role: string }) {
  return jwt.sign(payload, config.jwtAccessSecret, { expiresIn: '15m' });
}

export function signRefreshToken(payload: { id: string; email: string; role: string }) {
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.jwtAccessSecret) as { id: string; email: string; role: string };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, config.jwtRefreshSecret) as { id: string; email: string; role: string };
}
