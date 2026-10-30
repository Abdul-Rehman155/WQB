const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../Model/userSchema');
const {
  loginIpLimiter,
  loginEmailLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} = require('../middleware/authRateLimiters');

const router = express.Router();

// Seed initial fallback users to prevent 404 when MongoDB has no records or is disconnected
const fallbackUsers = [
  { id: '1', _id: '1', name: 'Super Admin', email: 'admin@company.com', role: 'admin', password: '$2a$10$e8w3.U184wMv09H.2w3u3e1234567890abcdefghijklmnopqrstuu' },
  { id: '2', _id: '2', name: 'Salary Clerk', email: 'company@company.com', role: 'salary clerk', password: '$2a$10$e8w3.U184wMv09H.2w3u3e1234567890abcdefghijklmnopqrstuu' },
  { id: '3', _id: '3', name: 'HR Manager', email: 'hr@company.com', role: 'hr', password: '$2a$10$e8w3.U184wMv09H.2w3u3e1234567890abcdefghijklmnopqrstuu' },
  { id: '4', _id: '4', name: 'Accountant', email: 'user@company.com', role: 'accountant', password: '$2a$10$e8w3.U184wMv09H.2w3u3e1234567890abcdefghijklmnopqrstuu' }
];

const normalizeRole = (role) => {
  const normalized = (role || 'accountant').toString().toLowerCase().trim();
  if (normalized === 'user' || normalized === 'employee') return 'accountant';
  if (normalized === 'payroll' || normalized === 'company') return 'salary clerk';
  if (normalized === 'superadmin') return 'admin';
  return normalized;
};
const capitalizeFirstLetter = (value) => {
  const name = (value || '').trim();
  return name ? `${name.charAt(0).toUpperCase()}${name.slice(1)}` : name;
};
const allowedRoles = ['accountant', 'salary clerk', 'hr', 'admin'];
const roleMatches = (actualRole, requestedRole) => {
  const actual = normalizeRole(actualRole);
  const requested = normalizeRole(requestedRole);

  if (!requestedRole) return true;
  if (requested === 'admin' || requested === 'super admin') {
    return actual === 'admin' || actual === 'super admin';
  }
  if (requested === 'accountant' || requested === 'employee' || requested === 'user') {
    return actual === 'accountant' || actual === 'employee' || actual === 'user';
  }
  if (requested === 'salary clerk' || requested === 'payroll' || requested === 'company') {
    return actual === 'salary clerk' || actual === 'payroll' || actual === 'company';
  }
  return actual === requested;
};
const isMongoConnected = () => mongoose.connection.readyState === 1;

const mailTransporter = process.env.SMTP_USER && process.env.SMTP_APP_PASSWORD
  ? nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_APP_PASSWORD,
    },
  })
  : null;

const hashResetCode = (code) => crypto.createHash('sha256').update(code).digest('hex');
const resetCodeMatches = (code, storedHash) => {
  if (!storedHash) return false;
  const candidate = Buffer.from(hashResetCode(code), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
};

const createToken = (user) => jwt.sign(
  { id: user._id || user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET || 'secret-key',
  { expiresIn: '30d' }
);

const saveFallbackUser = async (userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const user = {
    id: String(Date.now()),
    _id: String(Date.now()),
    name: userData.name,
    email: userData.email.toLowerCase().trim(),
    password: hashedPassword,
    role: normalizeRole(userData.role || 'user')
  };
  fallbackUsers.push(user);
  return user;
};

const findFallbackUser = (email) => fallbackUsers.find((u) => u.email === email);

const compareStoredPassword = async (candidatePassword, storedPassword) => {
  if (!storedPassword) return false;
  try {
    return await bcrypt.compare(candidatePassword, storedPassword);
  } catch (error) {
    return storedPassword === candidatePassword;
  }
};

const findUserByEmail = async (email) => {
  const normalizedEmail = (email || '').toLowerCase().trim();

  if (isMongoConnected()) {
    try {
      const dbUser = await User.findOne({ email: normalizedEmail });
      if (dbUser) return dbUser;
    } catch (error) {
      return findFallbackUser(normalizedEmail);
    }
  }

  return findFallbackUser(normalizedEmail);
};

const createUserRecord = async (userData) => {
  const normalizedEmail = (userData.email || '').toLowerCase().trim();
  const role = normalizeRole(userData.role || 'accountant');

  if (isMongoConnected()) {
    const user = await User.create({
      name: userData.name,
      email: normalizedEmail,
      password: userData.password,
      role: role
    });
    return user;
  }

  return saveFallbackUser({ ...userData, password: userData.password, email: normalizedEmail, role });
};

// --- 1. GET ALL USERS ---
router.get('/all-users', async (req, res) => {
  try {
    let users = [];

    if (isMongoConnected()) {
      users = await User.find({}, 'name email role').sort({ createdAt: -1 }).lean();
    }

    if (users.length === 0 && fallbackUsers.length > 0) {
      users = fallbackUsers.map(u => ({
        id: u.id,
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role
      }));
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- 2. GET EMAIL BY ROLE (Handles Super Admin, Company, HR, Employee) ---
router.get("/get-email-by-role/:roleName", async (req, res) => {
  try {
    const { roleName } = req.params;
    let searchRole = roleName.trim().toLowerCase();

    // Database Role Mapping
    let rolesToMatch = [searchRole];

    if (["accountant", "employee", "user"].includes(searchRole)) {
      rolesToMatch = ["accountant", "employee", "user"];
    } else if (["salary clerk", "payroll", "company"].includes(searchRole)) {
      rolesToMatch = ["salary clerk", "payroll", "company"];
    } else if (["super admin", "admin"].includes(searchRole)) {
      rolesToMatch = ["admin", "super admin"];
    }

    // Database find query with $in
    const users = await User.find({
      role: { $in: rolesToMatch.map((r) => new RegExp(`^${r}$`, "i")) },
    }).select("email name _id role");

    if (!users || users.length === 0) {
      return res.status(404).json({
        message: `'${roleName}' role ke liye database mein koi user nahi mila.`,
      });
    }

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});

// --- 3. REGISTER ---
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedName = capitalizeFirstLetter(name);
    const normalizedEmail = (email || '').toLowerCase().trim();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    const normalizedRole = normalizeRole(role);
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role selected.' });
    }

    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email.' });
    }

    const user = await createUserRecord({
      name: normalizedName,
      email: normalizedEmail,
      password,
      role: normalizedRole
    });

    const token = createToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user._id || user.id, name: user.name, email: user.email, role: normalizeRole(user.role) }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- 4. LOGIN ---
router.post('/login', loginIpLimiter, loginEmailLimiter, async (req, res) => {
  try {
    const { email, password, requestedRole } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const storedUser = await findUserByEmail(normalizedEmail);
    const acceptedEmail = ['test@example.com', 'admin@company.com', 'user@company.com', 'payroll@company.com', 'company@company.com', 'hr@company.com'].includes(normalizedEmail);
    const acceptedPassword = ['123456', 'admin123', 'user123', 'payroll123'].includes(password);
    const isDemoCredential =
      process.env.NODE_ENV !== 'production' && acceptedEmail && acceptedPassword;

    if (storedUser) {
      const isValidPassword = await compareStoredPassword(password, storedUser.password);
      if (!isValidPassword && !isDemoCredential) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
    } else if (!isDemoCredential) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = storedUser || {
      _id: 'demo-user',
      id: 'demo-user',
      name: normalizedEmail === 'user@company.com' ? 'Demo User' : normalizedEmail === 'payroll@company.com' ? 'Demo Payroll' : 'Demo Admin',
      email: normalizedEmail,
      role: normalizedEmail === 'user@company.com' ? 'accountant' : normalizedEmail === 'payroll@company.com' ? 'salary clerk' : 'admin'
    };

    if (!roleMatches(user.role, requestedRole)) {
      return res.status(401).json({ message: 'This account does not belong to the selected role.' });
    }

    const token = createToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id || user.id, name: user.name, email: user.email, role: normalizeRole(user.role) }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- 5. FORGOT PASSWORD ---
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(200).json({
        message: 'If an account exists for this email, a reset code has been sent.',
      });
    }

    if (!mailTransporter) {
      return res.status(503).json({
        message: 'Password reset email is not configured. Add SMTP_USER and SMTP_APP_PASSWORD to backend/.env.',
      });
    }

    const resetCode = crypto.randomInt(100000, 1000000).toString();

    if (isMongoConnected() && user.save) {
      user.resetCode = hashResetCode(resetCode);
      user.resetCodeExpiresAt = Date.now() + 15 * 60 * 1000;
      await user.save();
    } else {
      user.resetCode = hashResetCode(resetCode);
      user.resetCodeExpiresAt = Date.now() + 15 * 60 * 1000;
    }

    await mailTransporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'WQB'}" <${process.env.SMTP_USER}>`,
      to: normalizedEmail,
      subject: 'Your WQB password reset code',
      text: `Your WQB password reset code is ${resetCode}. It expires in 15 minutes. If you did not request this, you can ignore this email.`,
      html: `<p>Your WQB password reset code is:</p><h2>${resetCode}</h2><p>This code expires in 15 minutes. If you did not request this, you can ignore this email.</p>`,
    });

    res.status(200).json({
      message: 'If an account exists for this email, a reset code has been sent.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- 6. RESET PASSWORD ---
router.post('/reset-password', resetPasswordLimiter, async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    if (!normalizedEmail || !resetCode || !newPassword) {
      return res.status(400).json({ message: 'Email, reset code and new password are required.' });
    }
    if (!/^\d{6}$/.test(resetCode) || newPassword.length < 6) {
      return res.status(400).json({
        message: 'Reset code must be 6 digits and password must be at least 6 characters.',
      });
    }

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email.' });
    }

    if (!user.resetCode || !resetCodeMatches(resetCode, user.resetCode)) {
      return res.status(400).json({ message: 'Invalid reset code.' });
    }

    if (!user.resetCodeExpiresAt || user.resetCodeExpiresAt < Date.now()) {
      return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
    }

    if (isMongoConnected() && user.save) {
      user.password = newPassword;
      user.resetCode = null;
      user.resetCodeExpiresAt = null;
      await user.save();
    } else {
      user.password = await bcrypt.hash(newPassword, 10);
      user.resetCode = null;
      user.resetCodeExpiresAt = null;
    }

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;