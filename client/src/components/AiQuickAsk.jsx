// frontend/src/components/AIQuickAsk.jsx
import React, { useEffect, useState } from 'react';

const AIQuickAsk = () => {
  const [response, setResponse] = useState(null);
  // ADDED: States for user authentication
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAsking, setIsAsking] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include', // Ensures cookies are sent
        });

        if (!res.ok) {
          throw new Error('Not authenticated');
        }

        // Check if the response was OK
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("handleAsk error:", err);
        setError(err.message || "Error connecting to AI service");
      } finally {
        setLoading(false); // NEW: End loading (runs in both success/error cases)
      }
    };
    fetchUser();
  }, []);

  // Optionally, render a loading state or error if needed
  if (loading) {
    return <div>Loading authentication...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }

  // Check if user is authenticated before allowing AI queries
   const handleAsk = async (question) => {
      setActiveQuestion(question); // 1. Set which button is active
      setIsAsking(true);          // 2. Start loading (if you're using this)
      setResponse(null);          // 3. Clear previous response (optional)
    
      try {
        const res = await fetch('/api/ai/ask', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question })
        });
    
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        
        const data = await res.json();
        setResponse(data.response);
      } catch (err) {
        console.error("Error:", err);
        setResponse("Error connecting to AI service");
      } finally {
        setIsAsking(false);       // 5. End loading (if using)
      }
  };

  // ADDED: Predefined questions for quick access
  return (
    <div className="ai-quickask">

      <div className="ai-response">
              {isAsking ? (
            <div className="loading-indicator">Wait lang po. Hinahanap pa namin...</div>
          ) : (
            <div className="chat-bubble">
              {response ? response : "Ano ang gusto mong itanong?"}
            </div>
          )}
      </div>
      <div className="predefined-buttons">
          <button 
            onClick={() => handleAsk("ano mababa ang stocks")}
            className={activeQuestion === "ano mababa ang stocks" ? "active" : ""}
            disabled={isAsking && activeQuestion !== "ano mababa ang stocks"}
          >
            Low Stock Alert
          </button>
          
          <button 
            onClick={() => handleAsk("ano mabenta ngayong araw")}
            className={activeQuestion === "ano mabenta ngayong araw" ? "active" : ""}
            disabled={isAsking && activeQuestion !== "ano mabenta ngayong araw"}
          >
            Today's Top Sales
          </button>
          
          <button 
            onClick={() => handleAsk("ano pinaka mabenta")}
            className={activeQuestion === "ano pinaka mabenta" ? "active" : ""}
            disabled={isAsking && activeQuestion !== "ano pinaka mabenta"}
          >
            Best Sellers natin
          </button>
      </div>
            
    </div>
  );
};

export default AIQuickAsk;