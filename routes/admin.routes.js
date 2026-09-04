import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/dashboard', async (_req, res) => {
    const [users, orders, payouts, tickets] = await Promise.all([
        prisma.user.count(),
        prisma.order.count(),
        prisma.payout.count(),
        prisma.ticket.count(),
    ]);
    return res.json({
        stats: {
            users,
            orders,
            payouts,
            tickets,
        },
    });
});
router.get('/users', async (_req, res) => {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isVerified: true,
            isActive: true,
            createdAt: true,
        },
    });
    return res.json({ users });
});
router.get('/payouts', async (_req, res) => {
    const payouts = await prisma.payout.findMany({
        orderBy: { requestedAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });
    return res.json({ payouts });
});
router.patch('/payouts/:id', async (req, res) => {
    const { status } = req.body ?? {};
    if (!['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    const payout = await prisma.payout.update({
        where: { id: req.params.id },
        data: {
            status,
            processedAt: status === 'COMPLETED' || status === 'REJECTED' ? new Date() : null,
        },
    });
    return res.json({ payout });
});
router.get('/kyc', async (req, res) => {
    const { status } = req.query;
    const users = await prisma.user.findMany({
        where: status ? { kycStatus: status } : { kycStatus: { not: 'NOT_SUBMITTED' } },
        orderBy: { kycSubmittedAt: 'desc' },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            kycStatus: true,
            dateOfBirth: true,
            addressLine1: true,
            city: true,
            stateProvince: true,
            postalCode: true,
            idDocumentType: true,
            idDocumentNumber: true,
            idDocumentFrontUrl: true,
            idDocumentBackUrl: true,
            kycSubmittedAt: true,
            kycReviewedAt: true,
            kycRejectionReason: true,
        },
    });
    return res.json({ users });
});
router.post('/kyc/:userId/review', async (req, res) => {
    const { action, reason } = req.body ?? {};
    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'action must be approve or reject' });
    }
    const user = await prisma.user.update({
        where: { id: req.params.userId },
        data: {
            kycStatus: action === 'approve' ? 'APPROVED' : 'REJECTED',
            kycReviewedAt: new Date(),
            kycRejectionReason: action === 'reject' ? (reason || 'Not specified') : null,
        },
        select: { id: true, email: true, kycStatus: true },
    });
    return res.json({ user });
});
router.get('/tickets', async (_req, res) => {
    const tickets = await prisma.ticket.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });
    return res.json({ tickets });
});
router.patch('/tickets/:id', async (req, res) => {
    const { status } = req.body ?? {};
    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    const ticket = await prisma.ticket.update({
        where: { id: req.params.id },
        data: { status },
    });
    return res.json({ ticket });
});
router.get('/orders', async (_req, res) => {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            plan: true,
            user: { select: { email: true, firstName: true, lastName: true } },
        },
    });
    return res.json({ orders });
});
export default router;
