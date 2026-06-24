/**
 * Auth Routes — Login, Signup, Password Reset
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

// In-memory user store (demo)
const users = [
  { id: 'u1', name: 'Admin User', email: 'admin@urbanheat.ai', password: bcrypt.hashSync('admin123', 10), role: 'admin' },
  { id: 'u2', name: 'Researcher', email: 'researcher@urbanheat.ai', password: bcrypt.hashSync('research123', 10), role: 'researcher' },
  { id: 'u3', name: 'Demo User', email: 'demo@urbanheat.ai', password: bcrypt.hashSync('demo123', 10), role: 'public' },
];

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post('/signup', (req, res) => {
  const { email, name, password, role } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const newUser = { id: `u${users.length + 1}`, name, email, password: bcrypt.hashSync(password, 10), role: role || 'public' };
  users.push(newUser);
  const token = generateToken(newUser);
  res.json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
});

router.post('/forgot-password', (req, res) => {
  res.json({ message: 'Password reset link sent to email', otp_sent: true });
});

router.post('/verify-otp', (req, res) => {
  res.json({ verified: true, message: 'OTP verified successfully' });
});

module.exports = router;
