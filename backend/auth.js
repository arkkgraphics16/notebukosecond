// backend/auth.js
import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import pool from './db.js';

dotenv.config();

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🎯 Route to initiate Google login
router.get('/google', (req, res) => {
  const redirectUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    }).toString();

  res.redirect(redirectUrl);
});

// 🔁 Callback handler for Google OAuth
router.get('/google/callback', async (req, res) => {
  try {
    const code = req.query.code;

    const { tokens } = await client.getToken({
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI
    });

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;

    let result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    let user;

    if (result.rows.length > 0) {
      user = result.rows[0];
    } else {
      const clientId = `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const insertResult = await pool.query(
        'INSERT INTO users (google_id, email, client_id) VALUES ($1, $2, $3) RETURNING *',
        [googleId, email, clientId]
      );
      user = insertResult.rows[0];
    }

    const jwtToken = jwt.sign(
      { client_id: user.client_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      maxAge: 1000 * 60 * 60 * 24 * 7
    });

    res.redirect('https://note-buko-886ay.ondigitalocean.app');
  } catch (err) {
    console.error('Google callback error:', err);
    res.status(500).send('Authentication failed.');
  }
});

// 🔍 Who am I?
router.get('/me', async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT * FROM users WHERE client_id = $1', [decoded.client_id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 🚪 Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None'
  });
  res.redirect('/');
});

export { router as authRouter };
