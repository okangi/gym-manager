import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getClasses } from '../../services/classService';
import { getBookings } from '../../services/bookingService';
import { getUsers } from '../../services/userService';
import { getBranches } from '../../services/branchService';
import { getTrainers } from '../../services/trainerService';
import { getAttendanceHistory } from '../../services/attendanceService';

function AdvancedAnalytics() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [popularClasses, setPopularClasses] = useState([]);
  const [trainerPerformance, setTrainerPerformance] = useState([]);
  const [retentionData, setRetentionData] = useState({ returning: 0, new: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBranches = async () => {
      const allBranches = await getBranches();
      setBranches(allBranches.filter(b => b.isActive));
    };
    loadBranches();
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!token) return;
      setLoading(true);
      try {
        // Get users
        let users = await getUsers(token);
        if (selectedBranch !== 'all') {
          users = users.filter(u => u.branchId === selectedBranch);
        }
        const memberIds = users.filter(u => u.role === 'member').map(u => u.id || u._id);

        // Get classes
        let classes = await getClasses();
        if (selectedBranch !== 'all') {
          classes = classes.filter(c => c.branchId === selectedBranch);
        }
        
        // Get bookings
        const bookings = await getBookings(token);
        const activeBookings = bookings.filter(b => b.status === 'active' || b.status === 'Confirmed');
        
        // Get trainers
        const trainers = await getTrainers(token);
        
        // Get attendance for member retention
        const attendanceRecords = await getAttendanceHistory(token);

        // Calculate popular classes
        const classCount = {};
        activeBookings.forEach(b => {
          if (memberIds.includes(b.userId)) {
            classCount[b.classId] = (classCount[b.classId] || 0) + 1;
          }
        });
        const popular = classes.map(c => ({
          name: c.name,
          count: classCount[c.id || c._id] || 0
        })).sort((a, b) => b.count - a.count);
        setPopularClasses(popular);

        // Calculate trainer performance
        const trainerCount = {};
        activeBookings.forEach(b => {
          if (memberIds.includes(b.userId)) {
            const cls = classes.find(c => (c.id || c._id) === b.classId);
            if (cls) {
              trainerCount[cls.trainerId] = (trainerCount[cls.trainerId] || 0) + 1;
            }
          }
        });
        const performance = trainers.map(t => ({
          name: t.name,
          count: trainerCount[t.id || t._id] || 0
        })).sort((a, b) => b.count - a.count);
        setTrainerPerformance(performance);

        // Calculate member retention based on attendance
        const memberAttendanceCount = {};
        attendanceRecords.forEach(record => {
          if (memberIds.includes(record.userId)) {
            memberAttendanceCount[record.userId] = (memberAttendanceCount[record.userId] || 0) + 1;
          }
        });
        
        const returning = Object.values(memberAttendanceCount).filter(count => count > 1).length;
        const newMembers = memberIds.length - returning;
        setRetentionData({ returning, new: newMembers });
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [selectedBranch, token]);

  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '30px', padding: '20px' },
    filterBar: { display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' },
    filterLabel: { color: theme === 'dark' ? '#ddd' : '#555', fontWeight: '500' },
    select: {
      padding: '6px 12px',
      borderRadius: '4px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    section: {
      backgroundColor: 'var(--card-bg)',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    title: { color: theme === 'dark' ? '#fff' : '#1877f2', marginBottom: '16px' },
    table: { width: '100%', borderCollapse: 'collapse' },
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
    statRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`
    },
    statLabel: { fontWeight: 'bold', color: theme === 'dark' ? '#ddd' : '#555' },
    statValue: { color: 'var(--text-primary)' },
    loadingText: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }
  };

  if (loading) {
    return <div style={styles.loadingText}>Loading analytics...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Advanced Analytics</h2>
      <div style={styles.filterBar}>
        <span style={styles.filterLabel}>Filter by branch:</span>
        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} style={styles.select}>
          <option value="all">All Branches</option>
          {branches.map((b, idx) => (
            <option key={b.id || b._id || `branch-${idx}`} value={b.id || b._id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.section}>
        <h2 style={styles.title}>Member Retention</h2>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Returning Members (2+ check‑ins)</span>
          <span style={styles.statValue}>{retentionData.returning}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>New Members (1 or less check‑ins)</span>
          <span style={styles.statValue}>{retentionData.new}</span>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.title}>Popular Classes</h2>
        {popularClasses.length === 0 ? (
          <p style={{ color: theme === 'dark' ? '#aaa' : '#666' }}>No bookings yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Class Name</th>
                <th style={styles.th}>Bookings</th>
              </tr>
            </thead>
            <tbody>
              {popularClasses.map((c, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>{c.name}</td>
                  <td style={styles.td}>{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.title}>Trainer Performance</h2>
        {trainerPerformance.length === 0 ? (
          <p style={{ color: theme === 'dark' ? '#aaa' : '#666' }}>No bookings yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Trainer Name</th>
                <th style={styles.th}>Bookings</th>
              </tr>
            </thead>
            <tbody>
              {trainerPerformance.map((t, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>{t.name}</td>
                  <td style={styles.td}>{t.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdvancedAnalytics;