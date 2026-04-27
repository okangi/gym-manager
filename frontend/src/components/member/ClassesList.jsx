import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getClasses, getClassBookingsCount, addToWaitlist, getWaitlist, autoBookFromWaitlist } from '../../services/classService';
import { addBooking, cancelBooking, getUserBookings } from '../../services/bookingService';
import { addActivityLog } from '../../services/activityLogger';

function ClassesList() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [classes, setClasses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState({});
  const [loading, setLoading] = useState(true);

  // Helper to set message with type
  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  // Helper to get class ID
  const getClassId = (classObj) => classObj?._id || classObj?.id;

  const loadData = async () => {
    if (!token || !user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const allClasses = await getClasses();
      const classesArray = Array.isArray(allClasses) ? allClasses : [];
      
      const enriched = await Promise.all(classesArray.map(async (c) => {
        const classId = getClassId(c);
        let bookedCount = 0;
        let waitlistArray = [];
        
        if (classId) {
          try {
            bookedCount = await getClassBookingsCount(classId, token);
            const waitlistData = await getWaitlist(classId, token);
            waitlistArray = Array.isArray(waitlistData) ? waitlistData : [];
          } catch (err) {
            console.error(`Error loading data for class ${classId}:`, err);
          }
        }
        
        return {
          ...c,
          id: classId,
          bookedCount: bookedCount,
          waitlistCount: waitlistArray.length,
          waitlistData: waitlistArray
        };
      }));
      
      setClasses(enriched);
      
      const bookings = await getUserBookings(token);
      setMyBookings(Array.isArray(bookings) ? bookings : []);
      
      const waitlistMap = {};
      for (const c of enriched) {
        const classId = getClassId(c);
        if (classId && c.waitlistData) {
          const userIdStr = user.id || user._id;
          waitlistMap[classId] = c.waitlistData.some(w => {
            const wId = w.userId || w._id || w;
            return wId === userIdStr;
          });
        }
      }
      setWaitlistStatus(waitlistMap);
      
    } catch (error) {
      console.error('Error loading classes:', error);
      showMessage('Failed to load classes. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, user?.id, user?._id]);

  const handleBook = async (classId, className, maxCapacity, currentEnrollment) => {
    if (!token) {
      showMessage('❌ Please login to book classes.', 'error');
      return;
    }
    
    const isFull = currentEnrollment >= maxCapacity;
    
    if (isFull) {
      if (window.confirm('Class is full. Join waitlist?')) {
        const added = await addToWaitlist(classId, user.id, token);
        if (added && added.success) {
          await addActivityLog(user.email, 'Join Waitlist', `Joined waitlist for ${className}`, token);
          showMessage(`✅ Added to waitlist for ${className}. You will be notified if a spot opens.`, 'success');
          await loadData();
        } else {
          showMessage('❌ You are already on the waitlist.', 'error');
        }
      }
      return;
    }
    
    // Get the class date from the class object
    const cls = classes.find(c => getClassId(c) === classId);
    let classDate = new Date();
    
    if (cls) {
      // Try to construct the class date from dayOfWeek
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDay = cls.dayOfWeek || cls.day;
      
      if (targetDay && daysOfWeek.includes(targetDay)) {
        const today = new Date();
        const todayIndex = today.getDay();
        const targetIndex = daysOfWeek.indexOf(targetDay);
        let daysUntil = targetIndex - todayIndex;
        if (daysUntil < 0) daysUntil += 7;
        classDate = new Date(today);
        classDate.setDate(today.getDate() + daysUntil);
        // Set the time from the class schedule
        if (cls.startTime || cls.time) {
          const [hours, minutes] = (cls.startTime || cls.time).split(':');
          classDate.setHours(parseInt(hours), parseInt(minutes), 0);
        }
      }
    }
    
    const bookingData = { 
      classId, 
      userId: user.id,
      classDate: classDate.toISOString()
    };
    
    const booking = await addBooking(bookingData, token);
    if (booking) {
      await addActivityLog(user.email, 'Class Booking', `Booked ${className}`, token);
      showMessage(`✅ Successfully booked ${className}!`, 'success');
      await loadData();
    } else {
      showMessage('❌ You already have an active booking for this class', 'error');
    }
  };

  const handleCancel = async (bookingId, className, classId) => {
    if (window.confirm(`Cancel your booking for ${className}?`)) {
      await cancelBooking(bookingId, token);
      await addActivityLog(user.email, 'Cancel Booking', `Cancelled ${className}`, token);
      showMessage(`✅ Cancelled ${className}`, 'success');
      
      const nextBooking = await autoBookFromWaitlist(classId, token);
      if (nextBooking && nextBooking.success) {
        showMessage(`✅ Cancelled ${className}. A spot has been auto-assigned to the next person on the waitlist.`, 'success');
      }
      await loadData();
    }
  };

  const getBookingForClass = (classId) => {
    const bookings = Array.isArray(myBookings) ? myBookings : [];
    return bookings.find(b => b.classId === classId);
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
    
    switch (messageType) {
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb'
        };
      case 'error':
        return {
          ...baseStyle,
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb'
        };
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffeeba'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb'
        };
    }
  };

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    list: { display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' },
    card: {
      padding: '16px',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '8px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`,
      color: theme === 'dark' ? '#eee' : '#333'
    },
    className: { margin: '0 0 12px 0', color: theme === 'dark' ? '#fff' : '#1877f2', fontSize: '1.2rem' },
    infoRow: { marginBottom: '8px', display: 'flex', justifyContent: 'space-between' },
    label: { fontWeight: 'bold', color: 'var(--text-secondary)' },
    value: { color: 'var(--text-primary)' },
    bookButton: {
      padding: '10px 16px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginTop: '12px',
      width: '100%',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    cancelButton: {
      padding: '10px 16px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginTop: '12px',
      width: '100%',
      fontSize: '14px',
      fontWeight: 'bold'
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '40px',
      color: 'var(--text-secondary)'
    },
    emptyContainer: {
      textAlign: 'center',
      padding: '40px',
      color: 'var(--text-secondary)'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Group Classes</h2>
        <div style={styles.loadingContainer}>Loading classes...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📚 Group Classes</h2>
      
      {message && (
        <div style={getMessageStyle()}>
          {message}
        </div>
      )}
      
      {classes.length === 0 ? (
        <div style={styles.emptyContainer}>
          <p>No classes available at the moment.</p>
          <p>Please check back later for new classes.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {classes.map(cls => {
            const classId = getClassId(cls);
            const booking = getBookingForClass(classId);
            const isBooked = !!booking;
            const isOnWaitlist = waitlistStatus[classId];
            const maxCapacity = cls.maxCapacity || cls.capacity || 20;
            const currentEnrollment = cls.currentEnrollment || cls.bookedCount || 0;
            const isFull = currentEnrollment >= maxCapacity;
            const waitlistCount = cls.waitingList?.length || cls.waitlistCount || 0;
            
            return (
              <div key={classId} style={styles.card}>
                <h3 style={styles.className}>{cls.name}</h3>
                
                <div style={styles.infoRow}>
                  <span style={styles.label}>Trainer:</span>
                  <span style={styles.value}>{cls.instructorName || cls.trainerName || 'TBD'}</span>
                </div>
                
                <div style={styles.infoRow}>
                  <span style={styles.label}>Schedule:</span>
                  <span style={styles.value}>{cls.dayOfWeek || cls.day || 'TBD'} at {cls.startTime || cls.time || 'TBD'}</span>
                </div>
                
                <div style={styles.infoRow}>
                  <span style={styles.label}>Duration:</span>
                  <span style={styles.value}>{cls.duration || 60} min</span>
                </div>
                
                <div style={styles.infoRow}>
                  <span style={styles.label}>Spots Available:</span>
                  <span style={styles.value}>{maxCapacity - currentEnrollment} / {maxCapacity}</span>
                </div>
                
                {waitlistCount > 0 && (
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Waitlist:</span>
                    <span style={styles.value}>{waitlistCount} people</span>
                  </div>
                )}
                
                {isBooked ? (
                  <button
                    onClick={() => handleCancel(booking.id, cls.name, classId)}
                    style={styles.cancelButton}
                  >
                    Cancel Booking
                  </button>
                ) : isOnWaitlist ? (
                  <button style={{ ...styles.bookButton, backgroundColor: '#ff9800', opacity: 0.8 }} disabled>
                    On Waitlist
                  </button>
                ) : (
                  <button
                    onClick={() => handleBook(classId, cls.name, maxCapacity, currentEnrollment)}
                    style={{
                      ...styles.bookButton,
                      backgroundColor: isFull ? '#ff9800' : '#1877f2'
                    }}
                  >
                    {isFull ? 'Join Waitlist' : 'Book Now'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ClassesList;