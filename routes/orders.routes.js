import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, orderSchema } from '../middleware/validate.js';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
    const orders = await prisma.order.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
    });
    return res.json({ orders });
});
router.post('/', requireAuth, validateBody(orderSchema), async (req, res) => {
    const { planId, currency } = req.body;
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || plan.status !== 'ACTIVE') {
        return res.status(404).json({ error: 'Plan not found' });
    }
    // Amount always comes from the database record, never from the client,
    // so a tampered frontend request can't buy a challenge for less.
    const order = await prisma.order.create({
        data: {
            userId: req.user.id,
            planId,
            amount: plan.price,
            currency,
            status: 'PENDING',
        },
    });
    return res.status(201).json({ order });
});
router.get('/:id', requireAuth, async (req, res) => {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            userId: req.user.id,
        },
    });
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    return res.json({ order });
});
export default router;
