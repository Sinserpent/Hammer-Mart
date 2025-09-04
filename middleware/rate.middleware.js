// middlewares/rateLimit.js
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const sellLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 1, // 1 request per window
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req), // safe fallback
  message: { error: 'Please wait 30 seconds before ordering again' },
  standardHeaders: true,
  legacyHeaders: false,
});
