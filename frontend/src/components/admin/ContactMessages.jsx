import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getContactMessages, markMessageRead, deleteContactMessage, updateMessageStatus } from '../../services/landingService';
import { addActivityLog } from '../../services/activityLogger';

function ContactMessages() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read, replied

  useEffect(() => {
    loadMessages();
  }, [token]);

  const loadMessages = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const data = await getContactMessages(token);
      const messagesArray = Array.isArray(data) ? data : [];
      setMessages(messagesArray);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id, currentStatus) => {
    if (currentStatus === 'read') return;
    
    try {
      await markMessageRead(id, token);
      await addActivityLog(user?.email, 'Message Read', `Marked message ${id} as read`, token);
      setSuccess('Message marked as read');
      await loadMessages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error marking as read:', err);
      setError('Failed to mark message as read');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleMarkReplied = async (id) => {
    try {
      await updateMessageStatus(id, 'replied', token);
      await addActivityLog(user?.email, 'Message Replied', `Marked message ${id} as replied`, token);
      setSuccess('Message marked as replied');
      await loadMessages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error marking as replied:', err);
      setError('Failed to mark message as replied');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this message? This action cannot be undone.')) {
      try {
        await deleteContactMessage(id, token);
        await addActivityLog(user?.email, 'Message Delete', `Deleted message ${id}`, token);
        setSuccess('Message deleted successfully');
        await loadMessages();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error deleting message:', err);
        setError('Failed to delete message');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const getFilteredMessages = () => {
    if (filter === 'all') return messages;
    if (filter === 'unread') return messages.filter(m => m.status === 'new' || m.status === 'Unread');
    if (filter === 'read') return messages.filter(m => m.status === 'read');
    if (filter === 'replied') return messages.filter(m => m.status === 'replied');
    return messages;
  };

  const getStatusBadgeStyle = (status) => {
    switch(status?.toLowerCase()) {
      case 'new':
      case 'unread':
        return { backgroundColor: '#ff9800', color: 'white' };
      case 'read':
        return { backgroundColor: '#4caf50', color: 'white' };
      case 'replied':
        return { backgroundColor: '#1877f2', color: 'white' };
      default:
        return { backgroundColor: '#9e9e9e', color: 'white' };
    }
  };

  const filteredMessages = getFilteredMessages();
  const unreadCount = messages.filter(m => m.status === 'new' || m.status === 'Unread').length;

  const styles = {
    container: { padding: '20px' },
    header: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '12px'
    },
    title: { color: 'var(--text-primary)', margin: 0 },
    badge: {
      backgroundColor: '#f44336',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      marginLeft: '8px'
    },
    filterBar: { 
      display: 'flex', 
      gap: '8px', 
      marginBottom: '20px',
      flexWrap: 'wrap'
    },
    filterButton: {
      padding: '6px 12px',
      borderRadius: '20px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: 'transparent',
      color: theme === 'dark' ? '#eee' : '#333',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    activeFilter: {
      backgroundColor: '#1877f2',
      borderColor: '#1877f2',
      color: 'white'
    },
    tableWrapper: {
      overflowX: 'auto',
      borderRadius: '8px',
      border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: '12px',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#f8f9fa',
      color: theme === 'dark' ? '#eee' : '#333',
      borderBottom: `2px solid ${theme === 'dark' ? '#444' : '#dee2e6'}`,
      fontWeight: 'bold'
    },
    td: {
      padding: '10px',
      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
      color: theme === 'dark' ? '#ccc' : '#333',
      verticalAlign: 'top'
    },
    messageCell: {
      maxWidth: '300px'
    },
    messageText: {
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      fontSize: '13px'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold'
    },
    actions: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap'
    },
    readButton: {
      padding: '4px 8px',
      backgroundColor: '#4caf50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '11px'
    },
    repliedButton: {
      padding: '4px 8px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '11px'
    },
    deleteButton: {
      padding: '4px 8px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '11px'
    },
    loading: {
      textAlign: 'center',
      padding: '40px',
      color: 'var(--text-secondary)'
    },
    error: {
      textAlign: 'center',
      padding: '12px',
      marginBottom: '16px',
      backgroundColor: '#f8d7da',
      color: '#721c24',
      borderRadius: '4px'
    },
    success: {
      textAlign: 'center',
      padding: '12px',
      marginBottom: '16px',
      backgroundColor: '#d4edda',
      color: '#155724',
      borderRadius: '4px'
    },
    empty: {
      textAlign: 'center',
      padding: '40px',
      color: 'var(--text-secondary)'
    },
    unreadRow: {
      backgroundColor: theme === 'dark' ? '#2a2a1a' : '#fff3e0'
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading messages...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          📬 Contact Messages
          {unreadCount > 0 && <span style={styles.badge}>{unreadCount} unread</span>}
        </h2>
      </div>
      
      <div style={styles.filterBar}>
        <button
          onClick={() => setFilter('all')}
          style={{
            ...styles.filterButton,
            ...(filter === 'all' ? styles.activeFilter : {})
          }}
        >
          All ({messages.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          style={{
            ...styles.filterButton,
            ...(filter === 'unread' ? styles.activeFilter : {})
          }}
        >
          Unread ({messages.filter(m => m.status === 'new' || m.status === 'Unread').length})
        </button>
        <button
          onClick={() => setFilter('read')}
          style={{
            ...styles.filterButton,
            ...(filter === 'read' ? styles.activeFilter : {})
          }}
        >
          Read ({messages.filter(m => m.status === 'read').length})
        </button>
        <button
          onClick={() => setFilter('replied')}
          style={{
            ...styles.filterButton,
            ...(filter === 'replied' ? styles.activeFilter : {})
          }}
        >
          Replied ({messages.filter(m => m.status === 'replied').length})
        </button>
      </div>
      
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}
      
      {filteredMessages.length === 0 ? (
        <div style={styles.empty}>
          {filter === 'all' ? 'No messages yet.' : `No ${filter} messages.`}
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table className="responsive-table" style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Message</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map(msg => {
                const isUnread = msg.status === 'new' || msg.status === 'Unread';
                return (
                  <tr key={msg._id || msg.id} style={isUnread ? styles.unreadRow : {}}>
                    <td data-label="Name" style={styles.td}>
                      <strong>{msg.name}</strong>
                    </td>
                    <td data-label="Email" style={styles.td}>{msg.email}</td>
                    <td data-label="Phone" style={styles.td}>{msg.phone || '—'}</td>
                    <td data-label="Subject" style={styles.td}>{msg.subject}</td>
                    <td data-label="Message" style={{ ...styles.td, ...styles.messageCell }}>
                      <div style={styles.messageText}>
                        {msg.message.length > 100 ? msg.message.substring(0, 100) + '...' : msg.message}
                      </div>
                    </td>
                    <td data-label="Status" style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        ...getStatusBadgeStyle(msg.status)
                      }}>
                        {msg.status === 'new' ? 'Unread' : msg.status}
                      </span>
                    </td>
                    <td data-label="Date" style={styles.td}>{new Date(msg.createdAt).toLocaleString()}</td>
                    <td data-label="Actions" style={styles.td}>
                      <div style={styles.actions}>
                        {isUnread && (
                          <button
                            onClick={() => handleMarkRead(msg._id || msg.id, msg.status)}
                            style={styles.readButton}
                            title="Mark as read"
                          >
                            ✓ Read
                          </button>
                        )}
                        {!isUnread && msg.status !== 'replied' && (
                          <button
                            onClick={() => handleMarkReplied(msg._id || msg.id)}
                            style={styles.repliedButton}
                            title="Mark as replied"
                          >
                            💬 Replied
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(msg._id || msg.id)}
                          style={styles.deleteButton}
                          title="Delete message"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {messages.length > 0 && (
        <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Total: {messages.length} messages | Showing: {filteredMessages.length}
        </div>
      )}
    </div>
  );
}

export default ContactMessages;