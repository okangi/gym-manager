import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getTrainers } from '../../services/trainerService';
import { getPrivateSessions, bookPrivateSession, cancelPrivateSession, getTrainerAvailability } from '../../services/privateSessionService';
import { addActivityLog } from '../../services/activityLogger';

function PrivateSessions() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [availability, setAvailability] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!token || !user) return;
      setLoading(true);
      try {
        // Get all trainers
        const allTrainers = await getTrainers(token);
        const activeTrainers = allTrainers.filter(t => t.isActive !== false);
        setTrainers(activeTrainers);
        
        // Get user's booked sessions
        const bookings = await getPrivateSessions(user.id, token);
        setMyBookings(bookings);
      } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user?.id, token]);

  const handleTrainerSelect = async (trainerId) => {
    setSelectedTrainer(trainerId);
    try {
      const slots = await getTrainerAvailability(trainerId, token);
      setAvailability(slots);
    } catch (error) {
      console.error('Error loading availability:', error);
      setAvailability([]);
    }
  };

  const handleBook = async (slot) => {
    if (bookingInProgress) return;
    setBookingInProgress(true);
    
    try {
      const sessionData = {
        trainerId: slot.trainerId || selectedTrainer,
        sessionDate: slot.sessionDate || slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration || 60,
        notes: `Private session booked with ${slot.trainerName || 'trainer'}`
      };
      
      const booking = await bookPrivateSession(sessionData, token);
      if (booking && booking.success !== false) {
        await addActivityLog(user?.email, 'Private Session', `Booked session with trainer`, token);
        showMessage('✅ Session booked successfully!', 'success');
        
        // Refresh availability and bookings
        const updatedSlots = await getTrainerAvailability(selectedTrainer, token);
        setAvailability(updatedSlots);
        
        const updatedBookings = await getPrivateSessions(user.id, token);
        setMyBookings(updatedBookings);
      } else {
        showMessage('❌ Booking failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error booking session:', error);
      showMessage('❌ Error booking session. Please try again.', 'error');
    } finally {
      setBookingInProgress(false);
    }
  };

  const handleCancel = async (sessionId) => {
    if (window.confirm('Cancel this session?')) {
      const result = await cancelPrivateSession(sessionId, token);
      if (result) {
        showMessage('✅ Session cancelled successfully', 'success');
        const updatedBookings = await getPrivateSessions(user.id, token);
        setMyBookings(updatedBookings);
      } else {
        showMessage('❌ Failed to cancel session', 'error');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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
    select: {
      padding: '8px',
      marginBottom: '20px',
      width: '100%',
      maxWidth: '300px',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      borderRadius: '4px'
    },
    slotCard: {
      padding: '12px',
      marginBottom: '8px',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '6px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`,
      color: theme === 'dark' ? '#eee' : '#333',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '10px'
    },
    button: {
      padding: '6px 12px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      opacity: bookingInProgress ? 0.7 : 1
    },
    cancelButton: {
      padding: '4px 10px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px'
    },
    sectionTitle: { 
      color: theme === 'dark' ? '#ddd' : '#555', 
      marginTop: '24px',
      marginBottom: '12px',
      fontSize: '18px',
      fontWeight: 'bold'
    },
    loading: {
      textAlign: 'center',
      padding: '40px',
      color: theme === 'dark' ? '#aaa' : '#666'
    },
    emptyText: {
      color: theme === 'dark' ? '#aaa' : '#666',
      padding: '20px',
      textAlign: 'center'
    },
    bookingItem: {
      padding: '12px',
      marginBottom: '8px',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '6px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '10px'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Private Solo Sessions</h2>
        <div style={styles.loading}>Loading sessions...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🤝 Private Solo Sessions</h2>
      
      {message && <div style={getMessageStyle()}>{message}</div>}
      
      {trainers.length === 0 && (
        <div style={styles.emptyText}>
          No trainers available. Please check back later.
        </div>
      )}
      
      {trainers.length > 0 && (
        <>
          <select 
            onChange={e => handleTrainerSelect(e.target.value)} 
            style={styles.select} 
            value={selectedTrainer}
          >
            <option value="">Select a trainer</option>
            {trainers.map(t => (
              <option key={t.id || t._id} value={t.id || t._id}>
                {t.name} - {t.specialty || 'Personal Trainer'}
              </option>
            ))}
          </select>
          
          {selectedTrainer && (
            <>
              <h3 style={styles.sectionTitle}>Available Time Slots</h3>
              {availability.length === 0 ? (
                <p style={styles.emptyText}>No available slots for this trainer.</p>
              ) : (
                availability.map(slot => (
                  <div key={slot.id || slot._id} style={styles.slotCard}>
                    <span>
                      📅 {formatDate(slot.sessionDate || slot.date)} 
                      &nbsp; 🕐 {slot.startTime} - {slot.endTime}
                    </span>
                    <button 
                      onClick={() => handleBook(slot)} 
                      style={styles.button}
                      disabled={bookingInProgress}
                    >
                      {bookingInProgress ? 'Booking...' : 'Book'}
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </>
      )}
      
      <h3 style={styles.sectionTitle}>My Booked Sessions</h3>
      {myBookings.length === 0 ? (
        <p style={styles.emptyText}>No private sessions booked.</p>
      ) : (
        myBookings.map(booking => {
          const isActive = booking.status === 'booked' || booking.status === 'confirmed';
          return (
            <div key={booking.id || booking._id} style={styles.bookingItem}>
              <div>
                <div><strong>Trainer:</strong> {booking.trainerName || 'Trainer'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  📅 {formatDate(booking.sessionDate)} at {booking.startTime}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: isActive ? '#4caf50' : '#999',
                    color: 'white'
                  }}>
                    {booking.status === 'booked' || booking.status === 'confirmed' ? 'Confirmed' : booking.status}
                  </span>
                </div>
              </div>
              {isActive && (
                <button 
                  onClick={() => handleCancel(booking.id || booking._id)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default PrivateSessions;