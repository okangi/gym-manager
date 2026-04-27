import { Component } from 'react';
import { useTheme } from '../../context/ThemeContext';

// For class component, we need to consume context differently
// Option 1: Use useContext in a wrapper (recommended)
function ErrorBoundaryFallback({ error, errorInfo, resetError }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: isDark ? '#1a1a2e' : '#f5f5f5'
    },
    card: {
      maxWidth: '500px',
      padding: '40px',
      backgroundColor: isDark ? '#16213e' : 'white',
      borderRadius: '12px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    icon: { fontSize: '48px', marginBottom: '20px' },
    title: { fontSize: '24px', color: isDark ? '#fff' : '#333', marginBottom: '12px' },
    message: { fontSize: '16px', color: isDark ? '#ccc' : '#666', marginBottom: '20px' },
    details: { marginTop: '20px', textAlign: 'left', backgroundColor: isDark ? '#1e2a3a' : '#f8f9fa', borderRadius: '8px', padding: '12px' },
    summary: { cursor: 'pointer', color: isDark ? '#aaa' : '#666', fontWeight: 'bold' },
    pre: { marginTop: '10px', padding: '10px', backgroundColor: isDark ? '#0f3460' : '#e9ecef', borderRadius: '4px', fontSize: '12px', overflowX: 'auto', whiteSpace: 'pre-wrap', color: isDark ? '#eee' : '#333' },
    actions: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' },
    primaryButton: { padding: '10px 20px', backgroundColor: '#1877f2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    secondaryButton: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>⚠️</div>
        <h1 style={styles.title}>Something went wrong</h1>
        <p style={styles.message}>
          We're sorry, but something unexpected happened.
          Please try refreshing the page.
        </p>
        
        {process.env.NODE_ENV !== 'production' && (
          <details style={styles.details}>
            <summary style={styles.summary}>Error details (development only)</summary>
            <pre style={styles.pre}>
              {error && error.toString()}
              {errorInfo && errorInfo.componentStack}
            </pre>
          </details>
        )}
        
        <div style={styles.actions}>
          <button onClick={resetError} style={styles.primaryButton}>
            Refresh Page
          </button>
          <button onClick={() => window.location.href = '/'} style={styles.secondaryButton}>
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

// Class component Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // sendToErrorTracking(error, errorInfo);
    }
  }

  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;