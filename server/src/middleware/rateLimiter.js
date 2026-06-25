import rateLimit from 'express-rate-limit';

export const aiChatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AI_RATE_LIMIT_MAX || '40', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests. Please wait a few minutes and try again.',
  },
});

export const aiProfileRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AI_PROFILE_RATE_LIMIT_MAX || '60', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many profile requests. Please try again later.',
  },
});
