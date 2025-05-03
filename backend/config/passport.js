// backend/config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../../backend/db.js';
import dotenv from 'dotenv';
dotenv.config();

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI, 
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if a user exists with this Google ID.
      const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
      let user;
      if (result.rows.length > 0) {
        user = result.rows[0];
      } else {
        // If not, create a new user.
        const clientID = `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const insertQuery = `
          INSERT INTO users (google_id, email, client_id)
          VALUES ($1, $2, $3) RETURNING *`;
        const insertResult = await pool.query(insertQuery, [profile.id, profile.emails[0].value, clientID]);
        user = insertResult.rows[0];
      }
      return done(null, user);
    } catch (err) {
      console.error('Error in GoogleStrategy:', err);
      return done(err, null);
    }
  }
));

// Serialize the user (store client_id in session or cookie)
passport.serializeUser((user, done) => {
  done(null, user.client_id);
});

// Deserialize the user later if needed
passport.deserializeUser(async (clientID, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE client_id = $1', [clientID]);
    if (result.rows.length > 0) {
      done(null, result.rows[0]);
    } else {
      done(null, false);
    }
  } catch (err) {
    done(err, null);
  }
});


export default passport;