// client/src/components/InventoryItemForm.jsx
import React, { useState } from 'react';

function InventoryItemForm({ user, onNewItem, userItemCount, itemLimit, refreshCategories }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stocks: '',
    unit: 'pcs'
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const isLimitReached = userItemCount >= itemLimit; // CHANGES HERE: determine if the user hit their item limit 

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ensure submission only happens when a valid user exists.
    if (!user) {
      setError('You must be logged in to add an item.');
      return;
    }

    try {
        const targetRoute = userItemCount >= itemLimit
          ? '/api/inventory/limited'
          : '/api/inventory'; 

        const response = await fetch(targetRoute, {
// TOI: Use the correct route based on item count
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Ensures cookies are sent
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please log in again.');
        }
        throw new Error('Failed to add item');
      }

      const data = await response.json();

      onNewItem(data); // Update the parent view with the new item

      if (refreshCategories) refreshCategories();

      // Clear the form after successful submission
      setFormData({ name: '', category: '', price: '', stocks: '', unit: 'pcs' });
      setError(null);
    } catch (err) {
      console.error('Error adding item:', err);
      setError(err.message);
    }
  };

  return (
    <form className="inventory-form" onSubmit={handleSubmit}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="text"
        name="name"
        placeholder="Item Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="category"
        placeholder="Category"
        value={formData.category}
        onChange={handleChange}
      />
      <input
        type="number"
        name="price"
        placeholder="Price"
        value={formData.price}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="stocks"
        placeholder="Stocks Remaining"
        value={formData.stocks}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="unit"
        placeholder="Unit (default: pcs)"
        value={formData.unit}
        onChange={handleChange}
      />

      {/* TOI: Show limit warning message */}
      {isLimitReached && (
        <p style={{ color: 'orange', fontWeight: 'bold' }}>
          Item limit reached — upgrade to add more.
        </p>
      )}

      <button type="submit" disabled={isLimitReached || !user}>Add Item</button>  {/* TOI: Added logic to disable the button */}
      </form>
  );
}

export default InventoryItemForm;