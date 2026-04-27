import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUsers } from '../../services/userService';

function Statistics({ currentUser }) {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTotalUsers = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError('');
      
      try {
        const users = await getUsers(token);
        const usersArray = Array.isArray(users) ? users : [];
        // Count only members
        const memberCount = usersArray.filter(u => u.role === 'member').length;
        setTotalUsers(memberCount);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Could not load statistics');
        // Fallback to localStorage
        const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
        setTotalUsers(localUsers.filter(u => u.role === 'member').length);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTotalUsers();
  }, [token]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const lastLogin = currentUser?.lastLogin;
  const loginCount = currentUser?.loginCount || 0;

  const styles = {
    statsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    },
    statCard: {
      backgroundColor: theme === 'dark' ? '#0f3460' : '#e8f0fe',
      padding: '16px',
      borderRadius: '8px',
      textAlign: 'center',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default'
    },
    statCardHover: {
      transform: 'translateY(-2px)'
    },
    statNumber: {
      fontSize: 'clamp(20px, 5vw, 32px)',
      fontWeight: 'bold',
      margin: '0 0 8px 0',
      color: theme === 'dark' ? '#4caf50' : '#1877f2'
    },
    statLabel: {
      fontSize: '13px',
      color: theme === 'dark' ? '#ccc' : '#555',
      margin: 0,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    loadingText: {
      textAlign: 'center',
      padding: '20px',
      color: theme === 'dark' ? '#aaa' : '#666'
    },
    errorText: {
      textAlign: 'center',
      padding: '20px',
      color: '#f44336',
      fontSize: '13px'
    }
  };

  if (loading) {
    return (
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.loadingText}>Loading stats...</div>
        </div>
      </div>
    );
  }

  if (error && totalUsers === 0) {
    return (
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.errorText}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.statsContainer}>
      <div 
        className="stat-card" 
        style={styles.statCard}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <h3 style={styles.statNumber}>{totalUsers.toLocaleString()}</h3>
        <p style={styles.statLabel}>Total Members</p>
      </div>
      
      <div 
        className="stat-card" 
        style={styles.statCard}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <h3 style={styles.statNumber}>{loginCount.toLocaleString()}</h3>
        <p style={styles.statLabel}>Your Logins</p>
      </div>
      
      <div 
        className="stat-card" 
        style={styles.statCard}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <h3 style={styles.statNumber}>{formatDate(lastLogin)}</h3>
        <p style={styles.statLabel}>Last Login</p>
      </div>
    </div>
  );
}

export default Statistics;