const { rateLimit } = require('express-rate-limit');

const getEmailKey = (req) => {
  const email = typeof req.body?.email === 'string'
    ? req.body.email.toLowerCase().trim()
    : 'no-email';

  return `${req.ip}:${email}`;
};

const createAuthLimiter = ({ max, message }) => rateLimit({
  windowMs: 5 * 60 * 1000,
  max,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message },
});

const loginIpLimiter = createAuthLimiter({
  max: 10,
  message: 'Too many login attempts from this network. Please try again in 15 minutes.',
});

const loginEmailLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyGenerator: getEmailKey,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many login attempts for this account. Please try again in 15 minutes.' },
});

const registerLimiter = createAuthLimiter({
  max: 10,
  message: 'Too many registration attempts. Please try again in 15 minutes.',
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  keyGenerator: getEmailKey,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many password reset requests. Please try again in 15 minutes.' },
});

const resetPasswordLimiter = createAuthLimiter({
  max: 10,
  message: 'Too many password reset attempts. Please try again in 15 minutes.',
});

module.exports = {
  loginIpLimiter,
  loginEmailLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
};
