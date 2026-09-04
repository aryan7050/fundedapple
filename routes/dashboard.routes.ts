import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/summary', requireAuth, async (req, res) => {
  const accounts = await prisma.account.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  });

  const payouts = await prisma.payout.findMany({
    where: { userId: req.user!.id },
    orderBy: { requestedAt: 'desc' },
    take: 5,
  });

  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { plan: true },
  });

  return res.json({
    totalAccounts: accounts.length,
    activeAccount: accounts[0] ?? null,
    accounts,
    recentPayouts: payouts,
    recentOrders: orders,
    summary: {
      fundedBalance: accounts.reduce((sum, account) => sum + Number(account.balance), 0),
      status: accounts[0]?.status ?? 'PENDING',
    },
  });
});

router.get('/accounts', requireAuth, async (req, res) => {
  const accounts = await prisma.account.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({ accounts });
});

export default router;
