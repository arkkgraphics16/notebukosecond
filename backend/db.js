import pg from 'pg';
import 'dotenv/config';


const { Pool } = pg;


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


pool.query('SELECT NOW()')
  .then(() => console.log("🔥 Database connected!"))
  .catch(err => console.error("DB connection error:", err));


export default pool;