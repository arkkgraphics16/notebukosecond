// backend/routes/inventoryRoutes.js
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// 🔹 Retrieve all inventory items for the current user
// 🔹 Fetch inventory for the authenticated client
router.get('/', async (req, res) => {
  try {
    const clientId = req.cookies.client_id;
    
    if (!clientId) {
      return res.status(401).json({ error: "Unauthorized: Please log in first." });
    }
    
    const result = await pool.query(
      'SELECT * FROM inventory WHERE client_id = $1 ORDER BY id ASC',
      [clientId]
    );
    
    // Always return an array, even if it's empty.
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("GET /inventory Error:", err.message);
    res.status(500).json({ error: "An error occurred while fetching inventory." });
  }
});


// 🔹 Get unique categories for the current user
router.get('/categories', async (req, res) => {
  try {
    const clientId = req.cookies.client_id;
    if (!clientId) return res.status(401).json({ error: "Unauthorized" });

    const result = await pool.query(
      `SELECT DISTINCT category FROM inventory WHERE client_id = $1 AND category IS NOT NULL ORDER BY category ASC`,
      [clientId]
    );

    const categories = result.rows.map(row => row.category);
    res.json(categories);
  } catch (err) {
    console.error("GET /inventory/categories Error:", err.message);
    res.status(500).json({ error: "Error fetching categories" });
  }
});

// 🔹 Filter inventory items by category
router.get('/filter', async (req, res) => {
  const clientId = req.cookies.client_id;
  const category = req.query.category;

  if (!clientId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const query =
      category === '__ALL__'
        ? 'SELECT * FROM inventory WHERE client_id = $1 ORDER BY id ASC'
        : 'SELECT * FROM inventory WHERE client_id = $1 AND category = $2 ORDER BY id ASC';

    const values = category === '__ALL__' ? [clientId] : [clientId, category];
    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (err) {
    console.error(`GET /inventory/filter?category=${category} Error:`, err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// 🔹 Add a new inventory item
router.post('/', async (req, res) => {
  try {
    const clientId = req.cookies.client_id;
    if (!clientId) {
      return res.status(401).json({ error: "Unauthorized - client_id not found" });
    }

    const { name, category, price, stocks, unit } = req.body;

    // Ensure required fields are provided
    if (!name || !price || !stocks) {
      return res.status(400).json({ error: 'Missing required fields: name, price, or stocks' });
    }

    // Default unit to 'pcs' if not provided
    const unitToUse = unit || 'pcs';

    // Insert the new item into the database
    const query = `
      INSERT INTO inventory (client_id, name, category, price, stocks, unit)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [clientId, name, category, price, stocks, unitToUse]);

    // Return the created item
    const newItem = result.rows[0];
    res.status(201).json({
      id: newItem.id,
      name: newItem.name,
      category: newItem.category,
      price: newItem.price,
      stocks: newItem.stocks,
      unit: newItem.unit,
    });
  } catch (err) {
    console.error("POST /inventory Error:", err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔹 LIMIT: 
router.get('/count', async (req, res) => {
  const { client_id } = req.query;

  if (!client_id) {
    return res.status(400).json({ error: "Missing client_id parameter" });
  }

  try {
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM inventory WHERE client_id = $1",
      [client_id]
    );
    const currentCount = parseInt(countResult.rows[0].count, 10);
    res.json({ count: currentCount });
  } catch (err) {
    console.error("GET /inventory/count Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔹 LIMIT: Add a new inventory item with a limit of 50 items per user
router.post('/limited', async (req, res) => {
  try {
    const clientId = req.cookies.client_id;
    if (!clientId) {
      return res.status(401).json({ error: "Unauthorized - client_id not found" });
    }

    const { name, category, price, stocks, unit } = req.body;

    if (!name || price == null || stocks == null) {
      return res.status(400).json({ error: 'Missing required fields: name, price, or stocks' });
    }

    const unitToUse = unit || 'pcs';

    // Fetch the user's item limit from the users table
    const userResult = await pool.query(
      "SELECT item_limit FROM users WHERE client_id = $1",
      [clientId]
    );
    const itemLimit = userResult.rows[0]?.item_limit || 50;

    // Count current inventory items
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM inventory WHERE client_id = $1",
      [clientId]
    );
    const currentCount = parseInt(countResult.rows[0].count, 10);

    if (currentCount >= itemLimit) {
      return res.status(400).json({ error: "Limit reached. Upgrade to add more." });
    }

    const insertQuery = `
      INSERT INTO inventory (client_id, name, category, price, stocks, unit)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, category, price, stocks, unit
    `;
    const values = [clientId, name, category, price, stocks, unitToUse];
    const result = await pool.query(insertQuery, values);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /inventory Error:", err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 🔹 Update an inventory item
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!id) return res.status(400).json({ error: "Missing ID parameter" });
  
  try {
    // UPDATED: Added 'category' to the destructuring of req.body
    const { name, category, unit, price, stocks } = req.body;

    // UPDATED: Including 'category' in the SQL query and parameter list
    const query = `
      UPDATE inventory 
      SET name = $1, category = $2, unit = $3, price = $4, stocks = $5
      WHERE id = $6
      RETURNING *
    `;

    // UPDATED: Added category to the pool.query array; default unit remains 'pcs'
    const result = await pool.query(query, [name, category, unit || 'pcs', price, stocks, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" }); // 🔥 Prevents trying to update nonexistent records
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`PATCH /inventory/${id} Error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Delete an inventory item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: "Missing ID parameter" });

  try {
    const result = await pool.query('DELETE FROM inventory WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" }); // 🔥 Prevents deleting nonexistent records
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(`DELETE /inventory/${id} Error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;