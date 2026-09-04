import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
    const tickets = await prisma.ticket.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
    });
    return res.json({ tickets });
});
router.post('/', requireAuth, async (req, res) => {
    const { subject, message, priority } = req.body ?? {};
    if (!subject || !message) {
        return res.status(400).json({ error: 'subject and message are required' });
    }
    const ticket = await prisma.ticket.create({
        data: {
            userId: req.user.id,
            subject,
            message,
            priority: priority ?? 'MEDIUM',
            status: 'OPEN',
        },
    });
    return res.status(201).json({ ticket });
});
export default router;
