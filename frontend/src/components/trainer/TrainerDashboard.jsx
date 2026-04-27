import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getClasses } from '../../services/classService';
import { getBookings } from '../../services/bookingService';

function TrainerDashboard() {
  const { user, token } = useAuth(); // Added token
  const { theme } = useTheme();
  const [stats, setStats] = useState({ totalClasses: 0, totalBookings: 0, uniqueMembers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user || !token) return;
      
      setLoading(true);
      try {
        const branchId = user?.branchId;
        // Get all classes first
        const allClasses = await getClasses();
        
        // Filter classes assigned to this trainer AND in the same branch
        const myClasses = allClasses.filter(c => 
          c.trainerId === (user.id || user._id) && 
          (!branchId || c.branchId === branchId)
        );
        
        const classIds = myClasses.map(c => c.id || c._id);
        
        // Get all bookings
        const allBookings = await getBookings(token);
        
        // Filter bookings for this trainer's classes
        const myBookings = allBookings.filter(b => 
          classIds.includes(b.classId) && 
          b.status === 'active' || b.status === 'Confirmed'
        );
        
        // Get unique members
        const uniqueMembers = [...new Set(myBookings.map(b => b.userId))];
        
        setStats({
          totalClasses: myClasses.length,
          totalBookings: myBookings.length,
          uniqueMembers: uniqueMembers.length
        });
      } catch (error) {
        console.error('Error loading trainer dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, token]);

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    statsGrid: { display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' },
    card: {
      padding: '20px',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '8px',
      textAlign: 'center',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    statNumber: {
      fontSize: '32px',
      fontWeight: 'bold',
      margin: '10px 0',
      color: theme === 'dark' ? '#4caf50' : '#1877f2'
    },
    loading: {
      textAlign: 'center',
      padding: '40px',
      color: 'var(--text-primary)'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Trainer Dashboard</h2>
      <div style={styles.statsGrid}>
        <div style={styles.card}>
          <h3>My Classes</h3>
          <p style={styles.statNumber}>{stats.totalClasses}</p>
        </div>
        <div style={styles.card}>
          <h3>Total Bookings</h3>
          <p style={styles.statNumber}>{stats.totalBookings}</p>
        </div>
        <div style={styles.card}>
          <h3>Unique Members</h3>
          <p style={styles.statNumber}>{stats.uniqueMembers}</p>
        </div>
      </div>
    </div>
  );
}

export default TrainerDashboard;