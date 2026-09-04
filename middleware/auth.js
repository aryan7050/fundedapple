import { verifyAccessToken } from '../utils/jwt.js';
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const token = authHeader.replace('Bearer ', '');
        const payload = verifyAccessToken(token);
        req.user = {
            id: payload.id,
            email: payload.email,
            role: payload.role,
        };
        return next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
export function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    return next();
}
