import React, { useEffect, useState } from 'react';

function OAuthCallback() {
  const [status, setStatus] = useState('processing');
  const [platform, setPlatform] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const platformParam = params.get('platform');
    const statusParam = params.get('status');
    const messageParam = params.get('message');

    console.log('🔐 OAuth Callback Page Loaded');
    console.log('Platform:', platformParam);
    console.log('Status:', statusParam);
    console.log('Message:', messageParam);
    console.log('Is this a popup?', !!window.opener);

    setPlatform(platformParam || 'unknown');
    setStatus(statusParam || 'processing');
    setMessage(messageParam || '');

    // If this is a popup, send message to parent
    if (window.opener) {
      console.log('📤 Sending message to parent window...');
      
      // Send message to the parent window
      window.opener.postMessage({
        type: 'oauth-callback',
        platform: platformParam,
        status: statusParam,
        message: messageParam
      }, window.location.origin);

      // Close the popup after a short delay
      setTimeout(() => {
        console.log('🔒 Closing popup...');
        window.close();
      }, 1000);
    } else {
      // If not in a popup, redirect to dashboard
      console.log('🔄 Not in popup, redirecting to dashboard...');
      window.location.href = `/dashboard?platform=${platformParam}&status=${statusParam}&message=${messageParam}`;
    }
  }, []);

  // Show loading/status UI
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#ffffff'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
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
        <h2 style={{ color: '#1f2937', marginBottom: '8px' }}>
          {status === 'success' ? '✅ Connected Successfully!' : 
           status === 'error' ? '❌ Connection Failed' : 
           'Connecting...'}
        </h2>
        <p style={{ color: '#6b7280', marginTop: '0' }}>
          {status === 'success' ? `Connected to ${platform}` :
           status === 'error' ? message || 'Something went wrong' :
           'Please wait while we complete the connection...'}
        </p>
        {window.opener && (
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '16px' }}>
            This window will close automatically...
          </p>
        )}
      </div>
    </div>
  );
}

export default OAuthCallback;
