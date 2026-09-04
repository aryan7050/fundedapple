import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/history', requireAuth, async (req, res) => {
  const payouts = await prisma.payout.findMany({
    where: { userId: req.user!.id },
    orderBy: { requestedAt: 'desc' },
  });

  return res.json({ payouts });
});

router.post('/request', requireAuth, async (req, res) => {
  const { accountId, amount, payoutMethod, notes } = req.body ?? {};

  if (!accountId || !amount) {
    return res.status(400).json({ error: 'accountId and amount are required' });
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: req.user!.id },
  });

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const payout = await prisma.payout.create({
    data: {
      userId: req.user!.id,
      accountId,
      amount: Number(amount),
      payoutMethod: payoutMethod ?? 'bank_transfer',
      notes: notes ?? '',
      status: 'PENDING',
    },
  });

  return res.status(201).json({ payout });
});

export default router;
