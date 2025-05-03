// backend/routes/authRoutes.js
import { Router } from 'express';
import passport from '../../archived/config/passport.js';

const router = Router();

// Initiate Google OAuth login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res, next) => {
    // Ensure Passport actually stores the session
    req.login(req.user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }

      // Optional: set custom cookie (for client_id tracking)
      res.cookie('client_id', req.user.client_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      // 👇 Redirect to your React frontend
      res.redirect('https://note-buko-886ay.ondigitalocean.app');
    });
  }
);

router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json(req.user); // req.user comes from the session
  } else {
    return res.status(401).json({ error: 'Not authenticated' });
  }
});

export default router;