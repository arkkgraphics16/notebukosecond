//client/src/components/CategoryFilter.jsx
import React, { useEffect, useState } from 'react';

const CategoryFilter = ({ onFilter, categoryRefreshTrigger }) => {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState('__ALL__');

  useEffect(() => {
    // Fetch existing categories from backend
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/inventory/categories', { credentials: 'include' });
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };

    fetchCategories();
  }, [categoryRefreshTrigger]); 

  // Function to handle filtering based on selected category
  const handleFilter = async () => {
    try {
      let response;
      if (selected === '__ALL__') {
        response = await fetch('/api/inventory', { credentials: 'include' });
      } else {
        response = await fetch(`/api/inventory/filter?category=${encodeURIComponent(selected)}`, {
          credentials: 'include',
        });
      }
  
      const data = await response.json();
      onFilter(data);
    } catch (error) {
      console.error('Error filtering by category:', error);
    }
  };
  
  return (
    <div className="category-filter" style={{ margin: '16px 0' }}>
      <p style={{ marginBottom: '4px' }}>Pumili ng categorya:</p> {/* 👈 Instructional text */}
  
      <select value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="__ALL__">All</option>
        {categories.map((cat, index) => (
          <option key={index} value={cat}>{cat}</option>
        ))}
      </select>
  
      <button onClick={handleFilter} disabled={!selected} style={{ marginLeft: '8px' }}>
        Filter
      </button>
    </div>
  );
};

export default CategoryFilter;
