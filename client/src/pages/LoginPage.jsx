// client/src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import GoogleLoginButton from '../components/GoogleLoginButton'; // Adjust the import path as necessary

const LoginPage = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        // Relative path in production—same origin, same domain
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // send cookie
        });

        if (!response.ok) {
          setShowPopup(false);
          return;
        }

        const data = await response.json();
        if (data?.client_id) {
          setShowPopup(true);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setShowPopup(false);
      }
    };

    checkLogin();
  }, []);

  return (
    <div style={styles.container}>
      <h2>Please sign in</h2>
      <GoogleLoginButton />

      {showPopup && (
        <div style={styles.popupOverlay}>
          <div style={styles.popup}>
            <p>Logged in successfully!</p>
            <button style={styles.closeButton} onClick={() => setShowPopup(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    marginTop: '50px',
  },
  popupOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: '10px',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#007BFF',
    color: '#fff',
    cursor: 'pointer',
  },
};

export default LoginPage;
