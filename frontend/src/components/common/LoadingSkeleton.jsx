import { useTheme } from '../../context/ThemeContext';

function LoadingSkeleton({ type = 'card', count = 3 }) {
  const { theme } = useTheme();
  
  const getStyles = () => {
    const isDark = theme === 'dark';
    
    return {
      container: { display: 'flex', flexDirection: 'column', gap: '16px' },
      card: {
        padding: '16px',
        backgroundColor: isDark ? '#1e2a3a' : '#f0f0f0',
        borderRadius: '8px',
        border: `1px solid ${isDark ? '#2a4a6e' : '#e0e0e0'}`
      },
      cardHeader: {
        height: '20px',
        backgroundColor: isDark ? '#2a4a6e' : '#e0e0e0',
        borderRadius: '4px',
        marginBottom: '12px',
        width: '60%'
      },
      cardBody: { display: 'flex', flexDirection: 'column', gap: '8px' },
      line: {
        height: '16px',
        backgroundColor: isDark ? '#2a4a6e' : '#e0e0e0',
        borderRadius: '4px',
        width: '100%'
      },
      lineShort: {
        height: '16px',
        backgroundColor: isDark ? '#2a4a6e' : '#e0e0e0',
        borderRadius: '4px',
        width: '70%'
      },
      lineMedium: {
        height: '16px',
        backgroundColor: isDark ? '#2a4a6e' : '#e0e0e0',
        borderRadius: '4px',
        width: '50%'
      },
      tableRow: {
        display: 'flex',
        gap: '16px',
        padding: '12px',
        borderBottom: `1px solid ${isDark ? '#2a4a6e' : '#e0e0e0'}`
      },
      cell: {
        height: '20px',
        backgroundColor: isDark ? '#2a4a6e' : '#e0e0e0',
        borderRadius: '4px',
        flex: 1
      },
      chatMessage: {
        display: 'flex',
        gap: '12px',
        marginBottom: '16px'
      },
      avatar: {
        width: '40px',
        height: '40px',
        backgroundColor: isDark ? '#2a4a6e' : '#e0e0e0',
        borderRadius: '50%'
      },
      messageBubble: {
        flex: 1,
        padding: '12px',
        backgroundColor: isDark ? '#2a4a6e' : '#e0e0e0',
        borderRadius: '12px'
      },
      statCard: {
        padding: '16px',
        backgroundColor: isDark ? '#1e2a3a' : '#f0f0f0',
        borderRadius: '8px',
        textAlign: 'center'
      },
      statNumber: {
        height: '32px',
        width: '60%',
        margin: '0 auto 8px',
        backgroundColor: isDark ? '#2a4a6e' : '#e0e0e0',
        borderRadius: '4px'
      },
      statLabel: {
        height: '14px',
        width: '40%',
        margin: '0 auto',
        backgroundColor: isDark ? '#2a4a6e' : '#e0e0e0',
        borderRadius: '4px'
      },
      listItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        borderBottom: `1px solid ${isDark ? '#2a4a6e' : '#e0e0e0'}`
      },
      listItemLeft: {
        flex: 1
      },
      listItemTitle: {
        height: '16px',
        width: '60%',
        marginBottom: '8px',
        backgroundColor: isDark ? '#2a4a6e' : '#e0e0e0',
        borderRadius: '4px'
      },
      listItemSubtitle: {
        height: '12px',
        width: '40%',
        backgroundColor: isDark ? '#2a4a6e' : '#e0e0e0',
        borderRadius: '4px'
      },
      listItemRight: {
        width: '80px',
        height: '30px',
        backgroundColor: isDark ? '#2a4a6e' : '#e0e0e0',
        borderRadius: '4px'
      }
    };
  };

  const renderSkeleton = () => {
    const styles = getStyles();
    
    switch (type) {
      case 'card':
        return (
          <div style={styles.card}>
            <div style={styles.cardHeader}></div>
            <div style={styles.cardBody}>
              <div style={styles.line}></div>
              <div style={styles.lineShort}></div>
            </div>
          </div>
        );
        
      case 'stat':
        return (
          <div style={styles.statCard}>
            <div style={styles.statNumber}></div>
            <div style={styles.statLabel}></div>
          </div>
        );
        
      case 'table':
        return (
          <div style={styles.tableRow}>
            <div style={styles.cell}></div>
            <div style={styles.cell}></div>
            <div style={styles.cell}></div>
          </div>
        );
        
      case 'chat':
        return (
          <div style={styles.chatMessage}>
            <div style={styles.avatar}></div>
            <div style={styles.messageBubble}>
              <div style={styles.line}></div>
              <div style={styles.lineShort}></div>
            </div>
          </div>
        );
        
      case 'list':
        return (
          <div style={styles.listItem}>
            <div style={styles.listItemLeft}>
              <div style={styles.listItemTitle}></div>
              <div style={styles.listItemSubtitle}></div>
            </div>
            <div style={styles.listItemRight}></div>
          </div>
        );
        
      default:
        return <div style={styles.line}></div>;
    }
  };

  const styles = getStyles();

  return (
    <div style={styles.container}>
      {Array(count).fill().map((_, i) => (
        <div key={i} className="skeleton-animation">
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
}

// Add animation styles to document head (only once)
if (!document.querySelector('#skeleton-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'skeleton-styles';
  styleSheet.textContent = `
    .skeleton-animation {
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }
    @keyframes skeleton-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default LoadingSkeleton;