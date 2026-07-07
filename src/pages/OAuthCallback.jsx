import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function OAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const platform = params.get('platform');
    const status = params.get('status');
    const message = params.get('message');

    console.log('OAuth Callback received:', { platform, status, message });

    // If this is in a popup, send message to parent window
    if (window.opener) {
      // Send message to parent window
      window.opener.postMessage({
        type: 'oauth-callback',
        platform: platform,
        status: status,
        message: message
      }, window.location.origin);

      // Close the popup after sending message
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      // If not in a popup (direct access), redirect to dashboard with params
      navigate(`/dashboard?platform=${platform}&status=${status}&message=${message}`);
    }
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">Connecting...</h2>
        <p className="text-gray-500 mt-2">Please wait while we complete the connection.</p>
      </div>
    </div>
  );
}

export default OAuthCallback;
