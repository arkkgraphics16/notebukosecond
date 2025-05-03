// client/src/components/InventoryTable.jsx
import React, { useState } from 'react';

const InventoryTable = ({ items, setItems }) => {
  // Added state to track which rows are in edit mode
  const [editStates, setEditStates] = useState({}); // key: item.id => true/false

  // Added state to store the current input values when editing
  const [editValues, setEditValues] = useState({}); // key: item.id => { name, category, price, stocks, unit }

  // Toggle edit mode for a row. Initialize editValues when entering edit mode.
  const toggleEditMode = (id, item) => {
    setEditStates(prev => ({ ...prev, [id]: !prev[id] })); // Toggle edit state for this row
    if (!editStates[id]) {
      // When entering edit mode, initialize the input fields with the current item values
      setEditValues(prev => ({
        ...prev,
        [id]: {
          name: item.name,
          category: item.category,
          price: item.price,
          stocks: item.stocks,
          unit: item.unit,
        },
      }));
    }
  };

  // Handle changes in the input fields for a specific row
  const handleEditChange = (id, field, value) => {
    setEditValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  // Save the updated item by sending a PATCH request to your backend
  const handleSave = async (id) => {
    const updatedValues = editValues[id];
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedValues),
      });
      if (!response.ok) {
        throw new Error('Update failed');
      }
      const updatedItem = await response.json();
      // Update the inventory list with the updated item details
      setItems(prev => prev.map(item => (item.id === id ? updatedItem : item)));
      // Turn off edit mode for this row
      setEditStates(prev => ({ ...prev, [id]: false }));
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  // Existing delete handler; implement your delete logic as needed
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });
  
      if (!response.ok) {
        // the server will return { error: "..."} on 4xx/5xx
        const { error } = await response.json();
        throw new Error(error || 'Unknown delete error');
      }
      // Success! Remove the item from state so React re-renders the table:
      setItems(prev => prev.filter(item => item.id !== id));

    } catch (err) {
      console.error("Error deleting item:", err.message);
      // Optionally show a user-friendly notification here
    }
  };


  
  // RENDER
  return (
    <div>
      <table className="inventory-table"> {/* Ensure styling applies by adding the class */}
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stocks</th>
            <th>Unit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(items) && items.length > 0) ? (
            items.map(item => (
              <tr key={item.id}>
                <td>
                  {editStates[item.id] ? (
                    // Render input field when in edit mode
                    <input
                      type="text"
                      value={editValues[item.id].name}
                      onChange={(e) => handleEditChange(item.id, 'name', e.target.value)}
                    />
                  ) : (
                    item.name
                  )}
                </td>
                <td>
                  {editStates[item.id] ? (
                    <input
                      type="text"
                      value={editValues[item.id].category || ''}
                      onChange={(e) => handleEditChange(item.id, 'category', e.target.value)}
                    />
                  ) : (
                    item.category || 'N/A'
                  )}
                </td>
                <td>
                  {editStates[item.id] ? (
                    <input
                      type="number"
                      value={editValues[item.id].price}
                      onChange={(e) => handleEditChange(item.id, 'price', e.target.value)}
                    />
                  ) : (
                    item.price
                  )}
                </td>
                <td>
                  {editStates[item.id] ? (
                    <input
                      type="number"
                      value={editValues[item.id].stocks}
                      onChange={(e) => handleEditChange(item.id, 'stocks', e.target.value)}
                    />
                  ) : (
                    item.stocks
                  )}
                </td>
                <td>
                  {editStates[item.id] ? (
                    <input
                      type="text"
                      value={editValues[item.id].unit}
                      onChange={(e) => handleEditChange(item.id, 'unit', e.target.value)}
                    />
                  ) : (
                    item.unit
                  )}
                </td>
                <td class="action-cell">
                  {editStates[item.id] ? (
                    <>
                      {/* Save changes and cancel editing buttons */}
                      <button onClick={() => handleSave(item.id)}>Save</button>  {/* Save updated item */}
                      <button onClick={() => toggleEditMode(item.id, item)}>Cancel</button> {/* Cancel edit mode */}
                    </>
                  ) : (
                    <>
                      <button onClick={() => toggleEditMode(item.id, item)}>Edit</button> {/* Enter edit mode */}
                      <button onClick={() => handleDelete(item.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">No items found</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="bottom-spacer" style={{ height: '150px' }}></div>
    </div>
  );
};

export default InventoryTable;