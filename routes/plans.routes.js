import { Router } from 'express';
import { prisma } from '../db.js';
const router = Router();
router.get('/', async (_req, res) => {
    const plans = await prisma.plan.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { price: 'asc' },
    });
    return res.json({ plans });
});
router.get('/:id', async (req, res) => {
    const plan = await prisma.plan.findUnique({ where: { id: req.params.id } });
    if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
    }
    return res.json({ plan });
});
router.get('/lookup', async (req, res) => {
    const { track, size } = req.query;
    if (!track || !size) {
        return res.status(400).json({ error: 'track and size are required' });
    }
    const plan = await prisma.plan.findFirst({
        where: {
            trackKey: String(track),
            initialBalance: Number(size),
            status: 'ACTIVE',
        },
    });
    if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
    }
    return res.json({ plan });
});
router.post('/seed', async (_req, res) => {
    // This mirrors the exact pricing formula and rules already used on the
    // live site (js/app.js: priceMap, trackMultiplier, rulesByTrack), so the
    // database becomes the source of truth without inventing new numbers.
    const sizesByTrack = {
        two: [5000, 10000, 25000, 50000, 100000, 200000],
        one: [5000, 10000, 25000, 50000, 100000, 200000],
        blitz: [5000, 10000, 25000, 50000, 100000],
        instant: [5000, 10000, 25000, 50000],
    };
    const priceMap = {
        5000: 39,
        10000: 69,
        25000: 149,
        50000: 249,
        100000: 449,
        200000: 849,
    };
    const trackMultiplier = {
        two: 1,
        one: 0.9,
        blitz: 1.15,
        instant: 1.8,
    };
    const trackMeta = {
        two: {
            name: '2-Step Challenge',
            type: 'TWO_STEP',
            profitTarget: 8,
            profitTargetPhase2: 5,
            targetNote: null,
            maxDrawdown: 10,
            dailyLossLimit: 5,
            minTradingDays: 4,
            newsTradingAllowed: true,
            profitSplitLabel: 'Up to 90%',
        },
        one: {
            name: '1-Step Challenge',
            type: 'ONE_STEP',
            profitTarget: 10,
            profitTargetPhase2: null,
            targetNote: null,
            maxDrawdown: 6,
            dailyLossLimit: 4,
            minTradingDays: 4,
            newsTradingAllowed: false,
            profitSplitLabel: '80% start',
        },
        blitz: {
            name: 'Blitz Challenge',
            type: 'BLITZ',
            profitTarget: 6,
            profitTargetPhase2: null,
            targetNote: 'in 3 days',
            maxDrawdown: 8,
            dailyLossLimit: 4,
            minTradingDays: 2,
            newsTradingAllowed: true,
            profitSplitLabel: 'Up to 85%',
        },
        instant: {
            name: 'Instant Funding',
            type: 'INSTANT',
            profitTarget: 0,
            profitTargetPhase2: null,
            targetNote: null,
            maxDrawdown: 5,
            dailyLossLimit: 3,
            minTradingDays: 0,
            newsTradingAllowed: false,
            profitSplitLabel: '75% start',
        },
    };
    const plansToSeed = Object.entries(sizesByTrack).flatMap(([track, sizes]) => {
        const meta = trackMeta[track];
        return sizes.map((size) => ({
            trackKey: track,
            initialBalance: size,
            price: Math.round((priceMap[size] || 149) * (trackMultiplier[track] || 1)),
            name: `${meta.name} — $${size / 1000}K`,
            type: meta.type,
            profitTarget: meta.profitTarget,
            profitTargetPhase2: meta.profitTargetPhase2,
            targetNote: meta.targetNote,
            maxDrawdown: meta.maxDrawdown,
            dailyLossLimit: meta.dailyLossLimit,
            minTradingDays: meta.minTradingDays,
            newsTradingAllowed: meta.newsTradingAllowed,
            profitSplitLabel: meta.profitSplitLabel,
        }));
    });
    const seeded = await Promise.all(plansToSeed.map((plan) => prisma.plan.upsert({
        where: { trackKey_initialBalance: { trackKey: plan.trackKey, initialBalance: plan.initialBalance } },
        update: plan,
        create: plan,
    })));
    return res.json({ seeded, count: seeded.length });
});
export default router;
