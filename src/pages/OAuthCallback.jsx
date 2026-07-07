import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const platform = params.get('platform');
    const status = params.get('status');
    const message = params.get('message');

    console.log('🔐 OAuth Callback:', { platform, status, message });

    // Always redirect to dashboard with the parameters
    // This works whether it's a popup or a full page redirect
    navigate(`/dashboard?platform=${platform}&status=${status}&message=${message}`, { replace: true });

    // If this was a popup, close it after redirecting
    if (window.opener) {
      setTimeout(() => window.close(), 1000);
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #ec4899',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <h2>Redirecting...</h2>
        <p style={{ fontSize: '14px', color: '#666' }}>
          {new URLSearchParams(window.location.search).get('platform') || 'unknown'} connection completed
        </p>
      </div>
    </div>
  );
}

export default OAuthCallback;
