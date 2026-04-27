import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserLogs } from '../../services/activityLogger';

function ActivityLog({ currentUser }) {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.email && token) {
      loadLogs();
    }
  }, [currentUser, token]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Get logs from backend API
      const userLogs = await getUserLogs(currentUser.email, token);
      // Sort newest first
      userLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setLogs(userLogs);
    } catch (error) {
      console.error('Error loading activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleString();
  };

  const getActionIcon = (action) => {
    switch(action?.toLowerCase()) {
      case 'login': return '🔓';
      case 'profile edit': return '✏️';
      case 'password change': return '🔐';
      case 'class booking': return '📅';
      case 'class create': return '➕';
      case 'class edit': return '✏️';
      case 'class delete': return '🗑️';
      case 'branch create': return '🏢';
      case 'branch edit': return '✏️';
      case 'branch delete': return '🗑️';
      case 'trainer create': return '👨‍🏫';
      case 'trainer edit': return '✏️';
      case 'trainer delete': return '🗑️';
      case 'plan create': return '📋';
      case 'plan edit': return '✏️';
      case 'plan delete': return '🗑️';
      case 'payment create': return '💰';
      case 'checkin': return '✅';
      case 'checkout': return '❌';
      case 'landing page': return '🏠';
      case 'gym settings': return '⚙️';
      case 'export data': return '📥';
      case 'delete user': return '👤❌';
      case 'branch change': return '🏢🔄';
      case 'join waitlist': return '⏳';
      case 'cancel booking': return '❌📅';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Recent Activity</h3>
        <p style={styles.empty}>Loading activity...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Recent Activity</h3>
      {logs.length === 0 ? (
        <p style={styles.empty}>No activity yet.</p>
      ) : (
        <ul style={styles.list}>
          {logs.map((log, index) => (
            <li key={log.id || log._id || index} style={styles.listItem}>
              <span style={styles.icon}>{getActionIcon(log.action)}</span>
              <div style={styles.content}>
                <strong>{log.action}</strong>
                {log.details && <span style={styles.details}> – {log.details}</span>}
                <div style={styles.timestamp}>{formatDate(log.timestamp)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginTop: '24px',
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    textAlign: 'left'
  },
  title: {
    marginTop: 0,
    marginBottom: '16px',
    color: '#1877f2'
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '12px',
    borderBottom: '1px solid #eee',
    gap: '12px'
  },
  icon: {
    fontSize: '20px'
  },
  content: {
    flex: 1
  },
  details: {
    color: '#555',
    fontSize: '14px'
  },
  timestamp: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px'
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    padding: '20px'
  }
};

export default ActivityLog;