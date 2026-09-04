import { Router, raw } from 'express';
import Stripe from 'stripe';
import { config } from '../config/env.js';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
const stripe = new Stripe(config.stripeSecretKey || 'sk_test_placeholder', { apiVersion: '2024-06-20' });
router.post('/create-checkout', requireAuth, async (req, res) => {
    const { planId } = req.body ?? {};
    if (!planId) {
        return res.status(400).json({ error: 'planId is required' });
    }
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || plan.status !== 'ACTIVE') {
        return res.status(404).json({ error: 'Plan not found' });
    }
    // Amount always comes from the plan record in the database, never from
    // the client, so a tampered request can't check out for a lower price.
    const amount = plan.price;
    const order = await prisma.order.create({
        data: {
            userId: req.user.id,
            planId,
            amount,
            currency: 'USD',
            status: 'PENDING',
            paymentProvider: 'stripe',
        },
    });
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price_data: { currency: 'usd', unit_amount: Math.round(amount * 100), product_data: { name: plan.name } }, quantity: 1 }],
        success_url: `${config.frontendUrl}/dashboard.html?checkout=success&order=${order.id}`,
        cancel_url: `${config.frontendUrl}/payment.html?checkout=cancel&order=${order.id}`,
        metadata: {
            orderId: order.id,
            userId: req.user.id,
            planId: plan.id,
        },
    });
    await prisma.order.update({
        where: { id: order.id },
        data: { paymentIntentId: session.id },
    });
    return res.json({ checkoutUrl: session.url, orderId: order.id });
});
async function finalizeOrder(orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { plan: true } });
    if (!order || order.status === 'PAID') {
        // Already finalized (or doesn't exist) — safe to no-op so this can be
        // called from both the webhook and the confirm endpoint without ever
        // creating two accounts for the same order.
        return order;
    }
    const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
    });
    await prisma.account.create({
        data: {
            userId: order.userId,
            planId: order.planId,
            status: 'ACTIVE',
            phase: 'phase_1',
            balance: order.plan.initialBalance,
            startDate: new Date(),
        },
    });
    return updated;
}
router.get('/confirm/:orderId', requireAuth, async (req, res) => {
    const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== req.user.id) {
        return res.status(404).json({ error: 'Order not found' });
    }
    if (order.status === 'PAID') {
        return res.json({ order });
    }
    if (!order.paymentIntentId) {
        return res.status(400).json({ error: 'No payment session on this order yet' });
    }
    // Local dev / no webhook fallback: ask Stripe directly whether this
    // checkout session was actually paid, rather than trusting the client.
    const session = await stripe.checkout.sessions.retrieve(order.paymentIntentId);
    if (session.payment_status === 'paid') {
        const updated = await finalizeOrder(order.id);
        return res.json({ order: updated });
    }
    return res.json({ order });
});
router.post('/webhook', raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!config.stripeWebhookSecret) {
        return res.status(400).json({ error: 'Stripe webhook not configured' });
    }
    const payload = req.body;
    let event;
    try {
        event = stripe.webhooks.constructEvent(payload, signature, config.stripeWebhookSecret);
    }
    catch (error) {
        return res.status(400).json({ error: `Webhook signature verification failed: ${error.message}` });
    }
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        if (orderId) {
            await finalizeOrder(orderId);
        }
    }
    return res.json({ received: true });
});
export default router;
