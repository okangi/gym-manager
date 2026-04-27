import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../../services/notificationService';

function NotificationBell() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const loadNotifications = async () => {
    if (!user || !token) return;
    
    setLoading(true);
    try {
      const response = await getNotifications(token);
      // Handle both array response and object with notifications property
      const notifs = Array.isArray(response) ? response : (response.notifications || []);
      setNotifications(notifs);
      
      // Also get unread count
      const count = await getUnreadCount(token);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount and when user changes
  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, token]);

  // Listen for custom event (same-tab)
  useEffect(() => {
    const handleNotificationsUpdate = () => {
      loadNotifications();
    };
    window.addEventListener('notificationsUpdated', handleNotificationsUpdate);
    return () => window.removeEventListener('notificationsUpdated', handleNotificationsUpdate);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id, token);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead(token);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Refresh notifications when dropdown is opened
  const toggleDropdown = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const getNotificationIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const styles = {
    container: { position: 'relative', display: 'inline-block' },
    bellButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      position: 'relative',
      padding: '0 8px',
      color: 'var(--text-primary)'
    },
    badge: {
      position: 'absolute',
      top: '-5px',
      right: '0px',
      background: '#f44336',
      color: 'white',
      borderRadius: '50%',
      padding: '2px 6px',
      fontSize: '11px',
      minWidth: '18px',
      textAlign: 'center'
    },
    dropdown: {
      position: 'absolute',
      right: 0,
      top: '40px',
      width: '350px',
      maxHeight: '450px',
      overflowY: 'auto',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#fff',
      border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000
    },
    header: {
      padding: '10px 12px',
      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#fff',
      zIndex: 1
    },
    headerTitle: {
      fontWeight: 'bold',
      color: theme === 'dark' ? '#fff' : '#333'
    },
    markAllButton: {
      background: 'none',
      border: 'none',
      color: '#1877f2',
      cursor: 'pointer',
      fontSize: '12px'
    },
    notificationItem: {
      padding: '12px',
      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#eee'}`,
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    unreadItem: {
      backgroundColor: theme === 'dark' ? '#2a4a6e' : '#f0f7ff'
    },
    notificationMessage: {
      margin: 0,
      fontSize: '13px',
      color: theme === 'dark' ? '#eee' : '#333',
      wordBreak: 'break-word'
    },
    notificationTime: {
      fontSize: '11px',
      color: theme === 'dark' ? '#aaa' : '#888',
      marginTop: '4px',
      display: 'block'
    },
    emptyState: {
      padding: '30px',
      textAlign: 'center',
      color: theme === 'dark' ? '#aaa' : '#666',
      fontSize: '13px'
    },
    loadingState: {
      padding: '20px',
      textAlign: 'center',
      color: theme === 'dark' ? '#aaa' : '#666',
      fontSize: '13px'
    }
  };

  if (!user) return null;

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        style={styles.bellButton}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <span style={styles.headerTitle}>
              Notifications
              {unreadCount > 0 && ` (${unreadCount} unread)`}
            </span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={styles.markAllButton}>
                Mark all as read
              </button>
            )}
          </div>
          
          {loading && notifications.length === 0 ? (
            <div style={styles.loadingState}>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div style={styles.emptyState}>
              No notifications yet
            </div>
          ) : (
            notifications.map(notif => {
              const notifId = notif.id || notif._id;
              const isUnread = !notif.read;
              const icon = getNotificationIcon(notif.type);
              
              return (
                <div
                  key={notifId}
                  onClick={() => handleMarkRead(notifId)}
                  style={{
                    ...styles.notificationItem,
                    ...(isUnread ? styles.unreadItem : {})
                  }}
                >
                  <p style={styles.notificationMessage}>
                    {icon} {notif.title}: {notif.message}
                  </p>
                  <small style={styles.notificationTime}>
                    {new Date(notif.createdAt || notif.timestamp).toLocaleString()}
                  </small>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;