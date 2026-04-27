import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getUsers } from '../../services/userService';
import { getBranches } from '../../services/branchService';

function ReferralStats() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [stats, setStats] = useState({ totalReferrals: 0, topReferrers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (token) {
      loadStats();
    }
  }, [selectedBranch, token]);

  const loadBranches = async () => {
    try {
      const allBranches = await getBranches();
      setBranches(allBranches.filter(b => b.isActive !== false));
    } catch (error) {
      console.error('Error loading branches:', error);
      setError('Failed to load branches');
    }
  };

  const loadStats = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const allUsers = await getUsers(token);
      const usersArray = Array.isArray(allUsers) ? allUsers : [];
      
      // Filter by branch if needed
      const branchUsers = selectedBranch === 'all'
        ? usersArray
        : usersArray.filter(u => u.branchId === selectedBranch);
      
      // Get members only
      const members = branchUsers.filter(u => u.role === 'member');
      
      // Filter members who were referred by someone
      const referredMembers = members.filter(m => m.referredBy);
      
      // Count referrals per referrer (using Map for better performance)
      const counts = new Map();
      referredMembers.forEach(m => {
        const referrerEmail = m.referredBy;
        counts.set(referrerEmail, (counts.get(referrerEmail) || 0) + 1);
      });
      
      // Create user map for quick lookup
      const userMap = new Map();
      usersArray.forEach(user => {
        userMap.set(user.email, user);
      });
      
      // Build top referrers list
      const top = Array.from(counts.entries())
        .map(([email, count]) => {
          const user = userMap.get(email);
          return { 
            name: user?.name || email.split('@')[0], 
            email: email,
            count: count,
            role: user?.role || 'Unknown'
          };
        })
        .sort((a, b) => b.count - a.count);
      
      // Calculate additional stats
      const uniqueReferrers = counts.size;
      const averageReferralsPerReferrer = uniqueReferrers > 0 
        ? (referredMembers.length / uniqueReferrers).toFixed(1) 
        : 0;
      
      setStats({
        totalReferrals: referredMembers.length,
        topReferrers: top.slice(0, 5),
        uniqueReferrers: uniqueReferrers,
        averageReferrals: averageReferralsPerReferrer,
        totalMembers: members.length
      });
      
    } catch (error) {
      console.error('Error loading referral stats:', error);
      setError(error.message || 'Failed to load referral statistics');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    filterBar: { display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' },
    filterLabel: { color: theme === 'dark' ? '#ddd' : '#555', fontWeight: '500' },
    select: {
      padding: '6px 12px',
      borderRadius: '4px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    card: {
      backgroundColor: 'var(--card-bg)',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
      marginBottom: '20px'
    },
    statCard: {
      textAlign: 'center',
      padding: '12px',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#f8f9fa',
      borderRadius: '8px'
    },
    statNumber: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1877f2'
    },
    statLabel: {
      fontSize: '12px',
      color: 'var(--text-secondary)',
      marginTop: '4px'
    },
    list: { listStyle: 'none', padding: 0, margin: 0 },
    listItem: {
      padding: '10px',
      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
      color: theme === 'dark' ? '#eee' : '#333',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px'
    },
    referrerName: { fontWeight: 'bold' },
    referrerCount: {
      backgroundColor: '#1877f2',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px'
    },
    loading: {
      textAlign: 'center',
      padding: '40px',
      color: 'var(--text-secondary)'
    },
    error: {
      textAlign: 'center',
      padding: '20px',
      color: '#f44336',
      backgroundColor: theme === 'dark' ? '#2a1a1a' : '#ffebee',
      borderRadius: '4px',
      marginBottom: '20px'
    },
    badge: {
      fontSize: '11px',
      color: 'var(--text-secondary)',
      marginLeft: '8px'
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading referral statistics...</div>;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Referral Statistics</h2>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Referral Statistics</h2>
      
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
      
      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.totalReferrals}</div>
          <div style={styles.statLabel}>Total Referrals</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.uniqueReferrers || 0}</div>
          <div style={styles.statLabel}>Unique Referrers</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.averageReferrals || 0}</div>
          <div style={styles.statLabel}>Avg Referrals/Referrer</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.totalMembers || 0}</div>
          <div style={styles.statLabel}>Total Members</div>
        </div>
      </div>
      
      {/* Top Referrers Card */}
      <div style={styles.card}>
        <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>
          🏆 Top Referrers
        </h3>
        
        {stats.topReferrers.length === 0 ? (
          <p style={{ color: theme === 'dark' ? '#aaa' : '#666' }}>
            No referrals yet. When members refer friends, they'll appear here.
          </p>
        ) : (
          <ul style={styles.list}>
            {stats.topReferrers.map((r, i) => (
              <li key={i} style={styles.listItem}>
                <div>
                  <span style={styles.referrerName}>
                    {i === 0 && '🥇 '}
                    {i === 1 && '🥈 '}
                    {i === 2 && '🥉 '}
                    {r.name}
                  </span>
                  <span style={styles.badge}>{r.role === 'trainer' ? 'Trainer' : 'Member'}</span>
                </div>
                <div>
                  <span style={styles.referrerCount}>{r.count} referral(s)</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {stats.topReferrers.length > 0 && (
          <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Showing top {stats.topReferrers.length} referrers
          </div>
        )}
      </div>
      
      {/* Referral Info */}
      <div style={{ ...styles.card, backgroundColor: theme === 'dark' ? '#1e2a3a' : '#e3f2fd', marginTop: '20px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          💡 <strong>How referrals work:</strong> When a new member signs up and enters a referral code, 
          the referrer earns credits that can be redeemed for discounts on membership plans.
        </p>
      </div>
    </div>
  );
}

export default ReferralStats;