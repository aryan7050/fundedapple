import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import plansRoutes from './routes/plans.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import payoutsRoutes from './routes/payouts.routes.js';
import ticketsRoutes from './routes/tickets.routes.js';
import adminRoutes from './routes/admin.routes.js';
import kycRoutes from './routes/kyc.routes.js';

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use((req, res, next) => {
  // The Stripe webhook route needs the raw, unparsed request body to
  // verify the signature — skip the global JSON parser for it and let
  // payments.routes.ts handle its own raw body parsing.
  if (req.originalUrl === '/api/payments/webhook') {
    return next();
  }
  return express.json({ limit: '2mb' })(req, res, next);
});
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'fundedapple-backend', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payouts', payoutsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/kyc', kycRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.statusCode ?? 500).json({
    error: err.message ?? 'Internal Server Error',
  });
});

export default app;
