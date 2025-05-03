// backend/routes/aiRoutes.js
import express from 'express';
import pool from '../db.js';
import axios from 'axios';

const router = express.Router();

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Improved query processor with error handling
const queryProcessor = async (clientId, question) => {
  try {
    const questionLower = question.toLowerCase();

    const { rows: inventory } = await pool.query(
      `SELECT id, name, stocks, unit FROM inventory 
       WHERE client_id = $1 
       ORDER BY stocks ASC`,
      [clientId]
    );

    let sales = [];
    if (questionLower === "ano pinaka mabenta") {
      // Total sales aggregation
      const { rows } = await pool.query(
        `SELECT 
           s.item_id, 
           COALESCE(i.name, 'Deleted Item') as name, 
           SUM(s.stocks_sold_today) as total_sold, 
           SUM(s.earned_today) as total_earned 
         FROM sales s
         LEFT JOIN inventory i ON s.item_id = i.id
         WHERE s.client_id = $1
         GROUP BY s.item_id, i.name
         ORDER BY total_sold DESC`,
        [clientId]
      );
      sales = rows;
    } else if (questionLower === "ano mabenta ngayong araw") {
      // Today's sales
      const { rows } = await pool.query(
        `SELECT 
           s.item_id, 
           COALESCE(i.name, 'Deleted Item') as name, 
           s.stocks_sold_today, 
           s.earned_today 
         FROM sales s
         LEFT JOIN inventory i ON s.item_id = i.id
         WHERE s.client_id = $1
         ORDER BY s.earned_today DESC`,
        [clientId]
      );
      sales = rows;
    }

    const lowStockData = inventory.filter(item => item.stocks <= 5);
    const hasLowStock = lowStockData.length > 0;

    const prompts = {
      "ano mababa ang stocks": 
        `(Answer in casual tone, mix of English and Tagalog.
          Use the format IF data is available.
          If NO data is available, short concise answer, do NOT create a list.)
            
          ${lowStockData.length > 0 ? 
            `Low Stocks ay,
            [Name]: [Stock] nalang
            ...
            Magrestock ka na!` 
            : "Lahat ng items ay sapat ang stocks!"}
      
                (Instructions only, do NOT include in response  
                 Data: ${JSON.stringify(lowStockData)}, 
                 Do not use bold or italic formatting.)`,
              
      "ano mabenta ngayong araw":
        `Answer in a casual tone using a mix of English and Tagalog, or Taglish.
          Use the specified format if data is available. 
          If NO data is available, just show short message without generating a list.  

          ${sales.length > 0 ? 
            `Top Sales Ngayong Araw;
            1. [Name]. Nabenta: [Quantity], Sales: ₱[Amount]
            2. [Name]. Nabenta: [Quantity], Sales: ₱[Amount]
            3. [Name]. Nabenta: [Quantity], Sales: ₱[Amount]`
            : "Walang naitalang sales ngayong araw. Magpromote tayo!"}
          
                  (Instructions only, do not include in the answer  
                  - Data: ${JSON.stringify(sales.slice(0, 3))}  
                  - Two decimal places.  
                  - Do not use bold or italic formatting.)`,
      
      "ano pinaka mabenta":
        `Answer in a casual tone using a mix of English and Tagalog, or Taglish.
          Use the specified format IF data is available. 
          If NO data is available, show the short message without generating a list.  

            ${sales.length > 0 ? 
              `Pinaka mabenta ay;
              1. [Name]. Total Sold: [Quantity], at Total Sales: ₱[Amount]
              ...`
              : "Wala pang sales. Kaya nating magbenta ng marami!"}
                    
                    (Instructions only, do not include in the answer  
                      - Data: ${JSON.stringify(sales.slice(0, 3))}  
                      - Round the amount.  
                      - Do not use bold or italic formatting.)`
    };
    
    return prompts[question.toLowerCase()] || question;
  } catch (err) {
    console.error('Query Processor Error:', err);
    throw new Error('Failed to prepare AI context');
  }
};


router.post('/ask', async (req, res) => {
  try {
    const clientId = req.cookies.client_id;
    if (!clientId) return res.status(403).json({ error: 'Unauthorized' });

    const contextPrompt = await queryProcessor(clientId, req.body.question);
    
    console.log("AI Request Payload:", JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: contextPrompt }],
      temperature: 0.3
    }, null, 2));

    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: "deepseek-chat",
        messages: [{
          role: "user",
          content: contextPrompt
        }],
        temperature: 0.3, // Makes responses more consistent
        max_tokens: 50,
        response_format: {
          type: "text"  // Explicitly disable markdown
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    res.json({ 
      response: response.data.choices[0].message.content,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`AI Error [${new Date().toISOString()}]:`, error.message);
    
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || 
      "AI service temporarily unavailable";
    
    res.status(statusCode).json({ 
      error: errorMessage,
      suggestion: "Try again in a few moments"
    });
  }
});


export default router;