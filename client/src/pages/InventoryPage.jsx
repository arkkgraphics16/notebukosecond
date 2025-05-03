// client/src/pages/InventoryPage.jsx
import React, { useEffect, useState } from 'react';
import InventoryTable from '../components/InventoryTable';
import InventoryItemForm from '../components/InventoryItemForm';
import CategoryFilter from '../components/CategoryFilter'; // Import the CategoryFilter component

function InventoryPage() {
  const [items, setItems] = useState([]); // Holds inventory items
  const [user, setUser] = useState(null); // Store user info here
  const [loading, setLoading] = useState(true); // Show loading state while fetching data
  const [error, setError] = useState(null); // Store error message
  const [userItemCount, setUserItemCount] = useState(0); // Track number of items for the user

  // Fetch user data when the component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Ensures cookies are sent
        });

        if (!response.ok) {
          throw new Error('Not authenticated');
        }

        const data = await response.json();
        setUser(data); // Set the user if authenticated
      } catch (err) {
        setError(err.message); // Set error message if authentication fails
      } finally {
        setLoading(false); // Stop loading after the user data is fetched
      }
    };

    fetchUser();
  }, []);

  // Fetch inventory items once the user is authenticated
  useEffect(() => {
    if (user) {
      const fetchInventory = async () => {
        try {
          const response = await fetch('/api/inventory', {
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Failed to fetch inventory');
          }

          const data = await response.json();

          // Ensure data is an array before setting it
          if (Array.isArray(data)) {
            setItems(data);
          } else {
            console.error('Fetched data is not an array', data);
            setError('Unexpected response format.');
          }
        } catch (err) {
          setError('Error fetching inventory: ' + err.message);
        }
      };

      fetchInventory();
    }
  }, [user]);

  // Fetch the user's current item count
  useEffect(() => {
    if (user) {
      const fetchItemCount = async () => {
        try {
          const res = await fetch(`/api/inventory/count?client_id=${user.client_id}`, {
            credentials: 'include',
          });
          const data = await res.json();
          setUserItemCount(data.count); // Update the user item count
        } catch (err) {
          console.error('Failed to fetch item count', err);
        }
      };

      fetchItemCount();
    }
  }, [user]);

  const itemLimit = user?.item_limit || 50;

    const [categoryRefreshTrigger, setCategoryRefreshTrigger] = useState(0);

      const refreshCategories = () => {
        setCategoryRefreshTrigger((prev) => prev + 1); // Triggers CategoryFilter to re-fetch
      };
  
  // Move conditional rendering after all hooks have been called
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="inventory-page">
      <h2>Inventory</h2>


      {user && (
        <InventoryItemForm
          user={user}
          userItemCount={userItemCount} // CHANGES HERE: pass current item count
          itemLimit={itemLimit}         // CHANGES HERE: pass user's item limit
          refreshCategories={refreshCategories} // ✅ CATEGORY CHANGES here: pass down the trigger function
          onNewItem={(item) => {
            setItems((prevItems) => [...prevItems, item]); // CHANGES HERE: append item
            setUserItemCount((count) => count + 1);         // CHANGES HERE: bump count immediately
          }}
        />
      )}
  
        
      <CategoryFilter
          onFilter={(filteredItems) => setItems(filteredItems)}
          categoryRefreshTrigger={categoryRefreshTrigger} // ✅ STEP 1: ADD THIS
        />

      <InventoryTable items={items} setItems={setItems} />
    </div>
  );
}

export default InventoryPage;