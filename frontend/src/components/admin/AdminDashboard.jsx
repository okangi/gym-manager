import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUsers } from '../../services/userService';
import { getAllPayments } from '../../services/paymentService';
import { getBranches } from '../../services/branchService';
import { getGymSettings } from '../../services/gymSettingsService';

function AdminDashboard() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [stats, setStats] = useState({ totalUsers: 0, totalLogins: 0, totalAdmins: 0, totalRevenue: 0, totalTrainers: 0 });
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('$');

  // Load branches
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const allBranches = await getBranches();
        const activeBranches = allBranches.filter(b => b.isActive !== false);
        setBranches(activeBranches);
      } catch (error) {
        console.error('Error loading branches:', error);
      }
    };
    loadBranches();
  }, []);

  // Load currency symbol
  useEffect(() => {
    const loadCurrency = async () => {
      const settings = await getGymSettings();
      setCurrencySymbol(settings.currencySymbol || '$');
    };
    loadCurrency();
    
    const handleSettingsUpdate = async () => {
      const settings = await getGymSettings();
      setCurrencySymbol(settings.currencySymbol || '$');
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  // Load stats when branch changes
  useEffect(() => {
    const loadStats = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        // Get users with token
        let users = await getUsers(token);
        let usersArray = Array.isArray(users) ? users : [];
        
        // Get payments with token
        let payments = await getAllPayments(token);
        let paymentsArray = Array.isArray(payments) ? payments : [];

        if (selectedBranch !== 'all') {
          // Filter by branch
          const branchUserIds = usersArray
            .filter(u => u.branchId === selectedBranch)
            .map(u => u.id || u._id);
          
          usersArray = usersArray.filter(u => branchUserIds.includes(u.id || u._id));
          paymentsArray = paymentsArray.filter(p => branchUserIds.includes(p.userId));
        }

        setStats({
          totalUsers: usersArray.filter(u => u.role === 'member').length,
          totalLogins: usersArray.reduce((sum, u) => sum + (u.loginCount || 0), 0),
          totalAdmins: usersArray.filter(u => u.role === 'admin').length,
          totalTrainers: usersArray.filter(u => u.role === 'trainer').length,
          totalRevenue: paymentsArray.reduce((sum, p) => sum + (p.amount || 0), 0),
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [selectedBranch, token]);

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: theme === 'dark' ? '#1a1a2e' : '#f0f2f5',
    },
    card: {
      width: '90%',
      maxWidth: '1200px',
      backgroundColor: theme === 'dark' ? '#16213e' : 'white',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
      color: theme === 'dark' ? '#eee' : '#333',
    },
    title: { color: '#1877f2', marginBottom: '8px' },
    welcome: { color: theme === 'dark' ? '#ccc' : '#555', marginBottom: '24px' },
    filterBar: { display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' },
    filterLabel: { color: theme === 'dark' ? '#ddd' : '#555', fontWeight: '500' },
    select: {
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333',
      cursor: 'pointer',
    },
    statsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    statCard: {
      backgroundColor: theme === 'dark' ? '#0f3460' : '#f8f9fa',
      padding: '20px',
      borderRadius: '12px',
      textAlign: 'center',
    },
    statNumber: {
      fontSize: '32px',
      fontWeight: 'bold',
      margin: '10px 0',
      color: theme === 'dark' ? '#fff' : '#1877f2',
    },
    statLabel: { color: theme === 'dark' ? '#ccc' : '#555' },
    loading: { textAlign: 'center', padding: '20px', color: 'var(--text-primary)' },
    error: { textAlign: 'center', padding: '20px', color: '#f44336' }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loading}>📊 Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📊 Admin Dashboard</h1>
        <p style={styles.welcome}>Welcome back, {user?.name || user?.email} (Administrator)</p>

        <div style={styles.filterBar}>
          <label style={styles.filterLabel}>Filter by branch:</label>
          <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} style={styles.select}>
            <option value="all">🌍 All Branches</option>
            {branches.map((branch, idx) => (
              <option key={branch.id || branch._id || `branch-${idx}`} value={branch.id || branch._id}>
                🏢 {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalUsers}</div>
            <div style={styles.statLabel}>👥 Total Members</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalTrainers}</div>
            <div style={styles.statLabel}>🏋️ Trainers</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalLogins}</div>
            <div style={styles.statLabel}>🔐 Total Logins</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.totalAdmins}</div>
            <div style={styles.statLabel}>👑 Admin Users</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{currencySymbol}{stats.totalRevenue.toLocaleString()}</div>
            <div style={styles.statLabel}>💰 Total Revenue</div>
          </div>
        </div>
        
        {selectedBranch !== 'all' && (
          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Showing data for branch: {branches.find(b => (b.id || b._id) === selectedBranch)?.name}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;