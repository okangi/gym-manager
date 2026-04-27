import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUserBookings, cancelBooking } from '../../services/bookingService';
import { addActivityLog } from '../../services/activityLogger';

function MyBookings() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  useEffect(() => {
    loadBookings();
  }, [token]);

  const loadBookings = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const userBookings = await getUserBookings(token);
      console.log('Bookings from API:', userBookings);
      setBookings(Array.isArray(userBookings) ? userBookings : []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      showMessage('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId, className) => {
    if (window.confirm(`Cancel your booking for ${className}?`)) {
      await cancelBooking(bookingId, token);
      await addActivityLog(user?.email, 'Cancel Booking', `Cancelled ${className}`, token);
      showMessage(`✅ Cancelled ${className}`, 'success');
      await loadBookings();
    }
  };

  const getMessageStyle = () => {
    const baseStyle = {
      padding: '12px 16px',
      marginBottom: '16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      textAlign: 'center'
    };
    
    if (messageType === 'success') {
      return {
        ...baseStyle,
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb'
      };
    }
    return {
      ...baseStyle,
      backgroundColor: '#f8d7da',
      color: '#721c24',
      border: '1px solid #f5c6cb'
    };
  };

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    list: { display: 'flex', flexDirection: 'column', gap: '12px' },
    card: {
      padding: '16px',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '8px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px'
    },
    cardLeft: { flex: 1 },
    className: { margin: '0 0 8px 0', color: theme === 'dark' ? '#fff' : '#1877f2', fontSize: '1.1rem' },
    bookingInfo: { color: theme === 'dark' ? '#ccc' : '#666', fontSize: '12px', marginTop: '4px' },
    cancelButton: {
      padding: '8px 16px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    emptyContainer: {
      textAlign: 'center',
      padding: '40px',
      color: 'var(--text-secondary)'
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '40px',
      color: 'var(--text-secondary)'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>My Bookings</h2>
        <div style={styles.loadingContainer}>Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📅 My Bookings</h2>
      
      {message && <div style={getMessageStyle()}>{message}</div>}
      
      {bookings.length === 0 ? (
        <div style={styles.emptyContainer}>
          <p>You haven't booked any classes yet.</p>
          <p>Go to <strong>Classes</strong> to book your first class!</p>
        </div>
      ) : (
        <div style={styles.list}>
          {bookings.map(booking => {
            // The class data is already populated in classId field
            const classData = booking.classId || {};
            const className = classData.name || 'Unknown Class';
            const startTime = classData.startTime || 'TBD';
            const dayOfWeek = classData.dayOfWeek || 'TBD';
            
            return (
              <div key={booking.id || booking._id} style={styles.card}>
                <div style={styles.cardLeft}>
                  <h3 style={styles.className}>
                    {className}
                  </h3>
                  <div style={styles.bookingInfo}>
                    <div>📅 Booked on: {new Date(booking.bookingDate || booking.createdAt).toLocaleDateString()}</div>
                    <div>⏰ Class time: {startTime}</div>
                    <div>📆 Day: {dayOfWeek}</div>
                    <div>🏷️ Status: <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✓ Confirmed</span></div>
                  </div>
                </div>
                <button 
                  onClick={() => handleCancel(booking.id || booking._id, className)}
                  style={styles.cancelButton}
                >
                  Cancel Booking
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyBookings;