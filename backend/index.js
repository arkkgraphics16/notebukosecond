// backend/index.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { google } from 'googleapis';
import pool from './db.js'; 
import inventoryRoutes from './routes/inventoryRoutes.js';
import salesRoutes from './routes/salesRoute.js';
import authDecode from './middleware/authDecode.js';
import { errorHandler } from './middleware/errorHandler.js';
import trialCheck from './middleware/trialCheck.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


app.use(cookieParser());
app.use(cors({
  origin: 'https://note-buko-886ay.ondigitalocean.app',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

//decoder
app.use(authDecode);

app.use('/api/protected', trialCheck);

app.use('/api/ai', aiRoutes);
app.use('/api/inventory', inventoryRoutes);
// Sales routes protected by trialCheck middleware
app.use('/api/sales', trialCheck, salesRoutes);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Start Ouath2 flow
// Redirect user to Google's OAuth consent screen
app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email']
  });
  res.redirect(authUrl);
});


// OAuth Callback 
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    console.error("No code returned in OAuth callback");
    return res.status(400).send("Invalid OAuth callback");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();

    if (!data?.id || !data?.email) {
      console.error("Google user info incomplete:", data);
      return res.status(400).send("Invalid Google data");
    }

    const googleId = data.id;
    const email = data.email;
    const clientID = await getOrCreateClientID(googleId, email);

    res.cookie('client_id', clientID, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      //domain: 'note-buko-886ay.ondigitalocean.app',
      maxAge: 7 * 24 * 60 * 60 * 1000,  // 1 week
    });
    res.redirect('https://note-buko-886ay.ondigitalocean.app');
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("OAuth callback failed");
  }
});


// DB Users Insertion
export async function getOrCreateClientID(googleId, email) {
  try {
    const { rows } = await pool.query(
      'SELECT client_id FROM users WHERE google_id = $1 OR email = $2 LIMIT 1',
      [googleId, email]
    );

    if (rows.length > 0) {
      return rows[0].client_id;
    } else {
      const clientID = `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;  // <-- Capital D
      const result = await pool.query(
        'INSERT INTO users (client_id, google_id, email) VALUES ($1, $2, $3) RETURNING client_id',
        [clientID, googleId, email]  // <-- Also capital D here
      );
      return result.rows[0].client_id;
    }
  } catch (err) {
    console.error("Error creating/retrieving clientID:", err);
    throw err;
  }
}


// Check User
app.get('/api/auth/me', trialCheck, async (req, res) => {
  try {
    const clientID = req.cookies.client_id;
    if (!clientID) return res.status(401).json({ error: "No client ID found" });

    const result = await pool.query('SELECT * FROM users WHERE client_id = $1', [clientID]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
} else {
  app.get('/', (req, res) => res.send("Backend API is running in Development mode."));
}

// Logout route
app.get('/auth/logout', (req, res) => {
  // If you used a Redis or DB store, delete client_id from it here
  res.clearCookie('client_id', { httpOnly: true, secure: true, sameSite: 'None' });
  res.redirect('/');  // or send a JSON response
});

app.use(errorHandler);

app.get('/api/health', (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
