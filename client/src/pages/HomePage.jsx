// client/src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIQuickAsk from '../components/AiQuickAsk';

function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Fetch the user data and check if JWT is valid
        const response = await fetch('https://note-buko-886ay.ondigitalocean.app/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Optionally, you can send the token manually in the Authorization header, like:
            // 'Authorization': `Bearer ${token}`
          },
          credentials: 'include', // Include credentials (cookies) for JWT token
        });

        if (!response.ok) {
          throw new Error('Not authenticated');
        }

        const data = await response.json();
        setUser(data);
        setIsAuthenticated(true); // User is authenticated

        //tier check
        if (data.tier === 'basic' && new Date(data.trial_expires_at) < new Date()) {
          navigate('/upgrade');
          return;
        }

      } catch (error) {
        console.error('Error checking login status:', error);
        setIsAuthenticated(false);
        navigate('/login'); // Redirect to login page if not authenticated
      } finally {
        setLoading(false); // Done checking, set loading to false
      }
    };

    checkAuth(); // Check authentication status when component mounts
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>; // Show loading while checking authentication
  }

  return (
    <div className="homepage">
      <h1>Welcome to NOTEBUKO</h1>
           {/* ADDED: Display the AIQuickAsk component right under the welcome message */}
           <AIQuickAsk />
      {isAuthenticated ? (
        <div>
          <p>Hello, {user ? user.client_id : 'Guest'}! You are logged in.</p>
        </div>
      ) : (
        <p>Please log in to access your inventory.</p>
      )}
    </div>
  );
}

export default HomePage;
