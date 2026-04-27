import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

function ErrorFallback({ error, resetErrorBoundary }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    // Log error to console
    console.error('Application Error:', error);
    
    // In production, you can send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: send to Sentry, LogRocket, etc.
      // captureException(error);
      
      // Log to your backend
      fetch('/api/error-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error?.message,
          stack: error?.stack,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      }).catch(e => console.error('Failed to log error:', e));
    }
  }, [error]);

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: isDark ? '#1a1a2e' : '#f5f5f5'
    },
    content: {
      maxWidth: '500px',
      padding: '40px',
      backgroundColor: isDark ? '#16213e' : 'white',
      borderRadius: '12px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    icon: { fontSize: '48px', marginBottom: '20px' },
    title: { 
      fontSize: '24px', 
      color: isDark ? '#fff' : '#333', 
      marginBottom: '12px' 
    },
    message: { 
      fontSize: '16px', 
      color: isDark ? '#ccc' : '#666', 
      marginBottom: '20px' 
    },
    details: { 
      marginTop: '20px', 
      textAlign: 'left',
      backgroundColor: isDark ? '#1e2a3a' : '#f8f9fa',
      borderRadius: '8px',
      padding: '12px'
    },
    summary: { 
      cursor: 'pointer', 
      color: isDark ? '#aaa' : '#666',
      fontWeight: 'bold'
    },
    pre: { 
      marginTop: '10px', 
      padding: '10px', 
      backgroundColor: isDark ? '#0f3460' : '#f0f0f0',
      borderRadius: '4px',
      fontSize: '12px',
      overflowX: 'auto',
      color: isDark ? '#eee' : '#333',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word'
    },
    actions: { 
      display: 'flex', 
      gap: '12px', 
      justifyContent: 'center', 
      marginTop: '24px',
      flexWrap: 'wrap'
    },
    primaryButton: {
      padding: '10px 20px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      ':hover': {
        backgroundColor: '#145fbf'
      }
    },
    secondaryButton: {
      padding: '10px 20px',
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      ':hover': {
        backgroundColor: '#5a6268'
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.icon}>⚠️</div>
        <h1 style={styles.title}>Something went wrong</h1>
        <p style={styles.message}>
          We apologize for the inconvenience. Our team has been notified.
        </p>
        
        {/* User-friendly error message */}
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          backgroundColor: isDark ? '#2a1a1a' : '#fff3cd',
          borderRadius: '8px',
          color: isDark ? '#ff6b6b' : '#856404'
        }}>
          <strong>Error:</strong> {error?.message || 'An unexpected error occurred'}
        </div>
        
        {/* Detailed error info (development only) */}
        {process.env.NODE_ENV !== 'production' && error?.stack && (
          <details style={styles.details}>
            <summary style={styles.summary}>📋 Technical Details</summary>
            <pre style={styles.pre}>
              {error?.stack || error?.message || 'No stack trace available'}
            </pre>
          </details>
        )}
        
        <div style={styles.actions}>
          <button 
            onClick={resetErrorBoundary || handleReload} 
            style={styles.primaryButton}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#145fbf'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1877f2'}
          >
            🔄 Try Again
          </button>
          <button 
            onClick={handleGoHome} 
            style={styles.secondaryButton}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
          >
            🏠 Go to Home
          </button>
        </div>
        
        {/* Support contact info */}
        <div style={{ 
          marginTop: '20px', 
          fontSize: '12px', 
          color: isDark ? '#aaa' : '#888',
          borderTop: `1px solid ${isDark ? '#333' : '#eee'}`,
          paddingTop: '16px'
        }}>
          <p>If the problem persists, please contact support:</p>
          <p>📧 support@gymmanager.com</p>
          <p>📞 +254 702 266 017</p>
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;