// backend/middleware/authDecode.js
import pool from '../db.js';

export default async function authDecode(req, res, next) {
  try {
    const clientID = req.cookies.client_id;
    if (!clientID) {
      return next();   // no cookie, leave req.user undefined
    }

    const { rows } = await pool.query(
      'SELECT * FROM users WHERE client_id = $1',
      [clientID]
    );

    if (rows.length === 1) {
      req.user = rows[0];
    }
    // else user not found → req.user stays undefined

    next();
  } catch (err) {
    console.error("Auth decode error:", err);
    // Don't block everything on a DB slip; leave req.user undefined
    next();
  }
}
