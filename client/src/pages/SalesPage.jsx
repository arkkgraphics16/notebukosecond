// client/src/pages/SalesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // CHANGES TIER
import SalesTable from '../components/SalesTable';

const SalesPage = () => {
  const [salesData, setSalesData] = useState([]);
  const [user, setUser] = useState(null); // CHANGES TIER
  const navigate = useNavigate(); // CHANGES TIER

  // Fetch sales data using fetch() with session cookies
  const fetchSalesData = async () => {
    try {
      // Step 1: Authenticate user and get client info via cookie-based session
      const authRes = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (!authRes.ok) {
        throw new Error('Authentication failed');
      }
      const authData = await authRes.json();
      // client_id is now available in authData.client_id if needed for UI
      setUser(authData); // CHANGES TIER

      // CHANGES TIER: Redirect user if trial has expired
      if (authData.tier === 'basic' && new Date(authData.trial_expires_at) < new Date()) {
        navigate('/upgrade');
        return;
      }

      // Step 2: Fetch sales data using the same session (cookies)
      const salesRes = await fetch('/api/sales-page', {
        credentials: 'include',
      });
      if (!salesRes.ok) {
        throw new Error('Fetching sales data failed');
      }
      const salesDataJson = await salesRes.json();
      setSalesData(salesDataJson);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

// Tier: Redirect user if trial has expired
  useEffect(() => {
    fetchSalesData();
  }, [navigate]); // CHANGES TIER


  const handleSellOne = async (itemId) => {
    try {
      const res = await fetch('/api/sell-one', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }), 
      });
      if (!res.ok) {
        throw new Error('Sell one failed');
      }
      fetchSalesData();
    } catch (error) {
      console.error('Error on sell one:', error);
    }
  };
  

  // Handler for -1 sale (undo)
  const handleMinusOne = async (inventoryId) => {
    try {
      const res = await fetch('/api/minus-one', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inventoryId }),
      });
      if (!res.ok) {
        throw new Error('Minus one failed');
      }
      fetchSalesData();
    } catch (error) {
      console.error('Error on minus one:', error);
    }
  };

  // Handler for bulk sale of multiple units at once
  const handleBulkSell = async (inventoryId, quantity) => {
    if (quantity < 1) return;
    try {
      const res = await fetch('/api/bulk-sell', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inventoryId, quantity }),
      });
      if (!res.ok) {
        throw new Error('Bulk sell failed');
      }
      fetchSalesData();
    } catch (error) {
      console.error('Error on bulk sell:', error);
    }
  };

  // Fetch sales data when the component mounts
  useEffect(() => {
    fetchSalesData();
  }, []);

  
  return (
    <div>
      <h1>Sales</h1>
      <SalesTable
        salesData={salesData}
        onSellOne={handleSellOne}
        onMinusOne={handleMinusOne}
        onBulkSell={handleBulkSell}
      />
    </div>
  );
};

export default SalesPage;
