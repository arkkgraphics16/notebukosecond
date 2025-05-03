// SalesTable.jsx
import React, { useState } from 'react';

const SalesTable = ({ salesData, onSellOne, onMinusOne, onBulkSell }) => {
  // Manage bulk sale input for each inventory item
  const [bulkQuantities, setBulkQuantities] = useState({});

  const handleBulkQtyChange = (itemId, value) => {
    setBulkQuantities(prev => ({ ...prev, [itemId]: Number(value) }));
  };

  return (
    <div className="sales-table-wrapper">    
      <table className="sales-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price (₱)</th>
            <th>Stocks Left</th>
            <th>➕ Add</th>
            <th>➖ Minus</th>
            <th>Bulk Sale Input</th>
            <th>Stocks Sold Today</th>
            <th>Earned Today (₱)</th>
          </tr>
        </thead>
        <tbody>
          {salesData.map(item => (
            <tr key={item.item_id}>
              <td>{item.name}</td>
              <td>{Number(item.price).toFixed(2)}</td>
              <td>{item.stocks}</td>
              <td>
                <button onClick={() => onSellOne(item.item_id)}>+1</button>
              </td>
              <td>
                <button onClick={() => onMinusOne(item.item_id)}>-1</button>
              </td>
              <td className="quantity-cell">
                <input
                  type="number"
                  min="1"
                  value={bulkQuantities[item.item_id] || ''}
                  onChange={(e) => handleBulkQtyChange(item.item_id, e.target.value)}
                  placeholder="Qty"
                />
                <button
                  onClick={() => {
                    const qty = bulkQuantities[item.item_id];
                    if (qty && qty > 0) {
                      onBulkSell(item.item_id, qty);
                    } else {
                      alert("Enter a quantity first");
                    }
                  }}
                >                  
                Bulk
                </button>
              </td>
              <td>{item.stocks_sold_today}</td>
              <td>{Number(item.earned_today).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bottom-sales" style={{ height: '150px' }}></div>
    </div>
  );
};

export default SalesTable;
