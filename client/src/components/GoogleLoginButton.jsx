// client/src/components/GoogleLoginButton.jsx
import React from 'react';

const GoogleLoginButton = () => {
  // This function simply redirects the browser to your OAuth endpoint.
  const handleGoogleLogin = () => {
    window.location.href = '/auth/google';
  };

  return (
    <button onClick={handleGoogleLogin} style={styles.button}>
      Sign in with Google
    </button>
  );
};

const styles = {
  button: {
    padding: '10px 20px',
    fontSize: '1rem',
    backgroundColor: '#4285F4',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default GoogleLoginButton;
