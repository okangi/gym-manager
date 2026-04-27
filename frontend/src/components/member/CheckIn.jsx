import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { addActivityLog } from '../../services/activityLogger';
import { getActiveMembership } from '../../services/membershipService';
import { getUserBookings } from '../../services/bookingService';
import { getClasses } from '../../services/classService';
import { addNotification } from '../../services/notificationService';

function CheckIn() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [attendance, setAttendance] = useState(() => {
    const stored = localStorage.getItem('gym_attendance');
    return stored ? JSON.parse(stored) : [];
  });
  const [todayBookings, setTodayBookings] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id || user?._id;

  const hasCheckedInToday = () => {
    const today = new Date().toDateString();
    const myAttendance = attendance.filter(a => a.userId === userId);
    return myAttendance.some(a => a.date === today);
  };

  const hasActiveMembership = () => {
    return !!(membership && membership.status === 'active');
  };

  useEffect(() => {
    const loadData = async () => {
      if (!userId || !token) {
        setLoading(false);
        return;
      }

      try {
        // Load membership using userId (not email)
        const activeMembership = await getActiveMembership(userId, token);
        setMembership(activeMembership);
        
        if (activeMembership) {
          // Load bookings with token
          const bookings = await getUserBookings(token);
          // Ensure bookings is an array
          const bookingsArray = Array.isArray(bookings) ? bookings : [];
          
          // Load classes
          const classesData = await getClasses();
          const classesArray = Array.isArray(classesData) ? classesData : classesData.classes || [];
          
          // Filter today's bookings
          const today = new Date().toDateString();
          const todayBookedClasses = bookingsArray
            .filter(b => {
              const bookingDate = new Date(b.bookingDate || b.date || b.createdAt);
              return bookingDate.toDateString() === today;
            })
            .map(b => {
              const cls = classesArray.find(c => (c.id || c._id) === (b.classId || b.class_id));
              if (!cls) return null;
              return { 
                id: cls.id || cls._id, 
                name: cls.name, 
                bookingId: b.id || b._id 
              };
            })
            .filter(c => c !== null);
          
          setTodayBookings(todayBookedClasses);
          if (todayBookedClasses.length > 0) {
            setSelectedClass(todayBookedClasses[0].id);
          } else {
            setSelectedClass('general');
          }
        }
      } catch (error) {
        console.error('Error loading check-in data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [userId, token]);

  const handleCheckIn = async () => {
    if (!hasActiveMembership()) {
      setMessage('❌ You need an active membership to check in.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (hasCheckedInToday()) {
      setMessage('❌ You have already checked in today!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const now = new Date();
    const selectedClassObj = todayBookings.find(c => c.id === selectedClass);
    const className = selectedClassObj ? selectedClassObj.name : 'General Gym Entry';

    const newRecord = {
      userId: userId,
      userName: user?.name,
      userEmail: user?.email,
      timestamp: now.toISOString(),
      date: now.toDateString(),
      time: now.toLocaleTimeString(),
      className: className
    };
    
    const updated = [...attendance, newRecord];
    localStorage.setItem('gym_attendance', JSON.stringify(updated));
    setAttendance(updated);
    
    await addActivityLog(user?.email, 'Check-in', `Checked into ${className}`, token);
    
    try {
      await addNotification({
        userId: userId,
        title: 'Check-in Successful',
        message: `You checked into ${className} at ${now.toLocaleTimeString()}.`,
        type: 'success'
      }, token);
    } catch (notifyError) {
      console.log('Notification not sent:', notifyError.message);
    }
    
    setMessage(`✅ Checked into ${className} at ${now.toLocaleTimeString()}`);
    setTimeout(() => setMessage(''), 3000);
  };

  const myAttendance = attendance.filter(a => a.userId === userId).reverse();

  const styles = {
    container: { padding: '20px', maxWidth: '600px', margin: '0 auto' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    subtitle: { color: theme === 'dark' ? '#ddd' : '#555', marginTop: '20px' },
    text: { color: theme === 'dark' ? '#aaa' : '#666' },
    select: {
      padding: '8px',
      margin: '10px 0',
      width: '100%',
      maxWidth: '300px',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      borderRadius: '4px'
    },
    checkinButton: {
      padding: '10px 20px',
      fontSize: '18px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      marginTop: '10px',
      opacity: hasCheckedInToday() || !hasActiveMembership() || loading ? 0.6 : 1
    },
    list: { paddingLeft: '20px' },
    listItem: { color: theme === 'dark' ? '#ccc' : '#333', marginBottom: '8px' },
    membershipBadge: {
      backgroundColor: hasActiveMembership() ? '#4caf50' : '#f44336',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      display: 'inline-block',
      marginBottom: '16px'
    },
    loadingText: {
      textAlign: 'center',
      padding: '20px',
      color: 'var(--text-secondary)'
    }
  };

  if (loading) {
    return <div style={styles.loadingText}>Loading check-in data...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Check-in</h2>
      
      <div style={styles.membershipBadge}>
        {hasActiveMembership() ? '✅ Active Membership' : '❌ No Active Membership'}
      </div>

      {hasActiveMembership() && todayBookings.length > 0 && (
        <>
          <label style={{ color: theme === 'dark' ? '#ddd' : '#555' }}>Select class to check into:</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={styles.select}>
            {todayBookings.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
            <option value="general">General Gym Entry</option>
          </select>
        </>
      )}

      {hasActiveMembership() && todayBookings.length === 0 && (
        <p style={styles.text}>No class bookings today. You can use General Gym Entry.</p>
      )}

      <button
        onClick={handleCheckIn}
        style={styles.checkinButton}
        disabled={hasCheckedInToday() || !hasActiveMembership() || loading}
      >
        {!hasActiveMembership()
          ? '❌ No Active Membership'
          : hasCheckedInToday()
          ? '✓ Already Checked In Today'
          : '✅ Check In Now'}
      </button>
      
      {message && <p style={{ color: message.includes('✅') ? '#4caf50' : '#f44336', marginTop: '10px' }}>{message}</p>}

      <h3 style={styles.subtitle}>Your Check-in History</h3>
      {myAttendance.length === 0 ? (
        <p style={styles.text}>No check-ins yet.</p>
      ) : (
        <ul style={styles.list}>
          {myAttendance.map((c, i) => (
            <li key={i} style={styles.listItem}>
              {c.date} at {c.time} – {c.className}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CheckIn;