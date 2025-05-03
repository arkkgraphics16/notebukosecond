// backend/routes/userRoutes.js
import express from 'express';
import pool from '../db.js'; // Your PostgreSQL connection pool module

const router = express.Router();

router.get('/sales-page', async (req, res) => {
  const clientId = req.cookies.client_id;
  if (!clientId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const queryText = `
      SELECT
        i.id                                   AS item_id,
        i.name,
        i.price,
        i.stocks,
        COALESCE(s.stock_sold_total, 0)   AS stock_sold_total,
        COALESCE(s.stocks_sold_today, 0)  AS stocks_sold_today,
        COALESCE(s.earned_today, 0.00)    AS earned_today
      FROM public.inventory i
      LEFT JOIN public.sales s
        ON s.item_id   = i.id
       AND s.client_id = i.client_id
      WHERE i.client_id = $1
      ORDER BY i.name;
    `;

    const { rows } = await pool.query(queryText, [clientId]);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching sales data:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});


// SELL ONE
router.post('/sell-one', async (req, res) => {
  const clientId = req.cookies.client_id; // client_id from the cookie
  const { itemId } = req.body;
  
  if (!clientId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await pool.query('BEGIN');

    // 1) Decrement inventory.stocks based on item_id and client_id
    const invRes = await pool.query(`
      UPDATE public.inventory
         SET stocks = stocks - 1
       WHERE id = $1
         AND client_id = $2
         AND stocks > 0
      RETURNING stocks, id, name, price;
    `, [itemId, clientId]);

    if (invRes.rowCount === 0) {
      throw new Error('Not enough stock or invalid item');
    }
    
    const { stocks, id, name, price } = invRes.rows[0];

    // 2) Upsert the sales row using item_id and client_id
    const salesRes = await pool.query(`
      INSERT INTO public.sales
        (item_id, name, price, stocks, stock_sold_total, stocks_sold_today, earned_today, client_id)
      VALUES
        ($1, $2, $3, $4, 1, 1, $3, $5)
      ON CONFLICT (item_id, client_id) DO UPDATE
      SET
        stock_sold_total  = public.sales.stock_sold_total  + 1,
        stocks_sold_today = public.sales.stocks_sold_today + 1,
        earned_today      = public.sales.earned_today      + $3
      RETURNING *;
    `, [id, name, price, stocks, clientId]);

    await pool.query('COMMIT');
    res.json({ success: true, newStock: stocks, sale: salesRes.rows[0] });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error in sell-one:', err.message);
    res.status(500).json({ error: err.message });
  }
});





// MINUS ONE
router.post('/minus-one', async (req, res) => {
  const clientId = req.cookies.client_id;
  const { inventoryId } = req.body;
  if (!clientId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await pool.query('BEGIN');

    // 1) Increment inventory.stocks
    const incInv = `
      UPDATE public.inventory
         SET stocks = stocks + 1
       WHERE id = $1
         AND client_id = $2
       RETURNING stocks;
    `;
    const invRes = await pool.query(incInv, [inventoryId, clientId]);
    if (invRes.rowCount === 0) {
      throw new Error('Invalid item');
    }

    // 2) Decrement sales counters
    const updSales = `
      UPDATE public.sales
         SET stock_sold_total  = GREATEST(stock_sold_total  - 1, 0),
             stocks_sold_today = GREATEST(stocks_sold_today - 1, 0),
             earned_today      = GREATEST(earned_today - i.price, 0)
      FROM public.inventory i
      WHERE sales.item_id   = i.id
        AND sales.item_id   = $1
        AND sales.client_id = $2
      RETURNING sales.*;
    `;
    const salesRes = await pool.query(updSales, [inventoryId, clientId]);
    if (salesRes.rowCount === 0) {
      throw new Error('Sales row missing');
    }

    await pool.query('COMMIT');
    res.json({ success: true, newStock: invRes.rows[0].stocks });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error in minus-one:', err);
    res.status(500).json({ error: err.message });
  }
});


// BULK
router.post('/bulk-sell', async (req, res) => {
  const clientId = req.cookies.client_id;
  let { inventoryId, quantity } = req.body;
  
  if (!clientId) return res.status(401).json({ error: 'Unauthorized' });
  
  quantity = parseInt(quantity, 10);
  if (isNaN(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }
  
  try {
    await pool.query('BEGIN');

    // 1) Decrement inventory.stocks by quantity
    const decInv = `
      UPDATE public.inventory
         SET stocks = stocks - $2
       WHERE id = $1
         AND client_id = $3
          AND stocks >= CAST($2 AS INTEGER)
      RETURNING stocks;
    `;
    const invRes = await pool.query(decInv, [inventoryId, quantity, clientId]);
    if (invRes.rowCount === 0) {
      throw new Error('Not enough stock or invalid item');
    }

    // 2) Increment sales counters
          const upsertSales = `
                INSERT INTO public.sales
            (item_id, name, price, stocks, stock_sold_total, stocks_sold_today, earned_today, client_id)
          SELECT
            i.id, i.name, i.price, i.stocks, CAST($2 AS INTEGER), CAST($2 AS INTEGER), i.price * CAST($2 AS INTEGER), i.client_id
          FROM public.inventory i
          WHERE i.id = $1 AND i.client_id = $3
          ON CONFLICT (item_id, client_id) DO UPDATE
          SET
            stock_sold_total  = sales.stock_sold_total  + CAST($2 AS INTEGER),
            stocks_sold_today = sales.stocks_sold_today + CAST($2 AS INTEGER),
            earned_today      = sales.earned_today      + (sales.price * CAST($2 AS INTEGER))
          RETURNING *;
        `;
  const salesRes = await pool.query(upsertSales, [inventoryId, quantity, clientId]);
  // Check if the sales row was updated or inserted
    if (salesRes.rowCount === 0) {
      throw new Error('Sales row missing');
    }

    await pool.query('COMMIT');
    res.json({ success: true, newStock: invRes.rows[0].stocks });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error in bulk-sell:', err);
    res.status(500).json({ error: err.message });
  }
});


export default router;