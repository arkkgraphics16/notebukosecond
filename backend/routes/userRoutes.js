// backend/routes/userRoutes.js
import express from 'express';

const router = express.Router();

// 🔹 Logout Route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.redirect('/');
  });
});

// 🔹 Get Logged-In User
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json(req.user);
  }
  res.status(401).json({ error: 'Not authenticated' });
});

export default router;