import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getClasses } from '../../services/classService';
import { getBookings } from '../../services/bookingService';
import { getMembersByBranch } from '../../services/userService';

function TrainerBookings() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookings();
  }, [user?.id, user?.branchId, token]);

  const loadBookings = async () => {
    if (!token || !user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Get all classes for this trainer
      const allClasses = await getClasses();
      const classesArray = Array.isArray(allClasses) ? allClasses : [];
      
      // Filter classes assigned to this trainer
      const myClasses = classesArray.filter(c => {
        const trainerId = c.trainerId || c.instructorId;
        return trainerId === user.id || trainerId === user._id;
      });
      
      const classIds = myClasses.map(c => c.id || c._id);
      
      // Get all bookings
      const allBookings = await getBookings(token);
      const bookingsArray = Array.isArray(allBookings) ? allBookings : [];
      
      // Filter bookings for this trainer's classes
      const myBookings = bookingsArray.filter(b => 
        classIds.includes(b.classId) && 
        (b.status === 'active' || b.status === 'Confirmed')
      );
      
      // Get members from the same branch (instead of all users)
      let membersList = [];
      if (user.branchId) {
        const branchMembers = await getMembersByBranch(user.branchId, token);
        membersList = Array.isArray(branchMembers) ? branchMembers : [];
      }
      
      // Enrich bookings with class and member info
      const enriched = myBookings.map(b => {
        const cls = myClasses.find(c => (c.id || c._id) === b.classId);
        const member = membersList.find(m => (m.id || m._id) === b.userId);
        
        return {
          id: b.id || b._id,
          className: cls?.name || 'Unknown',
          memberName: member?.name || 'Unknown Member',
          memberEmail: member?.email || 'N/A',
          memberPhone: member?.phone || 'Not provided',
          bookedAt: b.bookingDate || b.createdAt || b.bookedAt,
          status: b.status
        };
      });
      
      // Sort by booking date (newest first)
      enriched.sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));
      setBookings(enriched);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load bookings. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    tableWrapper: {
      overflowX: 'auto'
    },
    table: { 
      width: '100%', 
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: '12px',
      backgroundColor: 'var(--card-bg)',
      color: theme === 'dark' ? '#eee' : '#333',
      borderBottom: `2px solid ${theme === 'dark' ? '#444' : '#dee2e6'}`
    },
    td: {
      padding: '10px',
      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
      color: theme === 'dark' ? '#ccc' : '#333'
    },
    empty: { 
      textAlign: 'center', 
      color: theme === 'dark' ? '#aaa' : '#666', 
      padding: '20px' 
    },
    loading: {
      textAlign: 'center',
      padding: '40px',
      color: theme === 'dark' ? '#aaa' : '#666'
    },
    error: {
      textAlign: 'center',
      padding: '20px',
      color: '#f44336'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Class Bookings</h2>
        <div style={styles.loading}>Loading bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Class Bookings</h2>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📚 Class Bookings</h2>
      
      {bookings.length === 0 ? (
        <p style={styles.empty}>No bookings yet for your classes.</p>
      ) : (
        <>
          <div style={styles.tableWrapper}>
            <table className="responsive-table" style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Class</th>
                  <th style={styles.th}>Member</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Booked On</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td data-label="Class" style={styles.td}>
                      <strong>{b.className}</strong>
                    </td>
                    <td data-label="Member" style={styles.td}>{b.memberName}</td>
                    <td data-label="Email" style={styles.td}>{b.memberEmail}</td>
                    <td data-label="Phone" style={styles.td}>{b.memberPhone}</td>
                    <td data-label="Booked On" style={styles.td}>{formatDate(b.bookedAt)}</td>
                    <td data-label="Status" style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: b.status === 'Confirmed' || b.status === 'active' ? '#4caf50' : '#ff9800',
                        color: 'white'
                      }}>
                        {b.status === 'Confirmed' || b.status === 'active' ? '✅ Confirmed' : b.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Total bookings: {bookings.length}
          </div>
        </>
      )}
    </div>
  );
}

export default TrainerBookings;