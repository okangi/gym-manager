import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getAllPayments } from '../../services/paymentService';
import { getBranches } from '../../services/branchService';
import { getUsers } from '../../services/userService';
import { getCurrencySymbol } from '../../utils/currency';

function ManagePayments() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [payments, setPayments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currency, setCurrency] = useState('$');

  useEffect(() => {
    const loadCurrency = async () => {
      const symbol = await getCurrencySymbol();
      setCurrency(symbol);
    };
    loadCurrency();
    
    const handleSettingsUpdate = async () => {
      const symbol = await getCurrencySymbol();
      setCurrency(symbol);
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedBranch, token]);

  const loadData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const [allPayments, branchesData, usersData] = await Promise.all([
        getAllPayments(token),
        getBranches(),
        getUsers(token)
      ]);
      
      const activeBranches = branchesData.filter(b => b.isActive !== false);
      setBranches(activeBranches);
      
      // Create user maps for both ID and email lookup
      const userByIdMap = new Map();
      const userByEmailMap = new Map();
      
      usersData.forEach(user => {
        const userId = user.id || user._id;
        userByIdMap.set(userId, user);
        if (user.email) {
          userByEmailMap.set(user.email.toLowerCase(), user);
        }
      });
      
      // Enrich payments with user info
      const enriched = allPayments.map(payment => {
        let user = null;
        let userName = 'Unknown User';
        let userEmail = 'N/A';
        let branchId = null;
        
        // Try to find user by ID first
        if (payment.userId && userByIdMap.has(payment.userId)) {
          user = userByIdMap.get(payment.userId);
          userName = user.name;
          userEmail = user.email;
          branchId = user.branchId;
        }
        // If not found by ID, try by email from payment
        else if (payment.userEmail) {
          const emailKey = payment.userEmail.toLowerCase();
          if (userByEmailMap.has(emailKey)) {
            user = userByEmailMap.get(emailKey);
            userName = user.name;
            userEmail = user.email;
            branchId = user.branchId;
          } else {
            // Email found in payment but user doesn't exist in system
            userEmail = payment.userEmail;
            userName = payment.userName || payment.userEmail.split('@')[0];
          }
        }
        // If payment has notes with email, try to extract
        else if (payment.notes) {
          const emailMatch = payment.notes.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) {
            const extractedEmail = emailMatch[0].toLowerCase();
            if (userByEmailMap.has(extractedEmail)) {
              user = userByEmailMap.get(extractedEmail);
              userName = user.name;
              userEmail = user.email;
              branchId = user.branchId;
            } else {
              userEmail = extractedEmail;
              userName = extractedEmail.split('@')[0];
            }
          }
        }
        
        return {
          ...payment,
          id: payment.id || payment._id,
          userName: userName,
          userEmail: userEmail,
          branchId: branchId,
          planName: payment.planName || 'Membership Plan',
          amount: payment.amount || 0,
          status: payment.status || 'Completed',
          paymentMethod: payment.paymentMethod || 'Card'
        };
      });
      
      // Filter by branch
      const filtered = selectedBranch === 'all'
        ? enriched
        : enriched.filter(p => p.branchId === selectedBranch);
      
      setPayments(filtered);
      
      const revenue = filtered.reduce((sum, p) => sum + (p.amount || 0), 0);
      setTotalRevenue(revenue);
      
    } catch (error) {
      console.error('Error loading payments:', error);
      setError('Failed to load payment data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getBranchName = (branchId) => {
    if (!branchId) return '—';
    const branch = branches.find(b => (b.id || b._id) === branchId);
    return branch?.name || '—';
  };

  const getStatusBadgeStyle = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'completed') {
      return { backgroundColor: '#4caf50', color: 'white' };
    }
    if (statusLower === 'pending') {
      return { backgroundColor: '#ff9800', color: 'white' };
    }
    if (statusLower === 'failed') {
      return { backgroundColor: '#f44336', color: 'white' };
    }
    return { backgroundColor: '#9e9e9e', color: 'white' };
  };

  const styles = {
    container: {
      backgroundColor: 'var(--card-bg)',
      padding: '16px',
      borderRadius: '8px'
    },
    title: { color: 'var(--text-primary)', marginBottom: '16px' },
    filterBar: { display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' },
    filterLabel: { color: 'var(--text-secondary)', fontWeight: '500' },
    select: {
      padding: '6px 12px',
      borderRadius: '4px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    revenue: { 
      color: '#4caf50', 
      marginBottom: '16px', 
      fontSize: '18px',
      fontWeight: 'bold',
      padding: '10px',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#e8f5e9',
      borderRadius: '4px'
    },
    tableWrapper: {
      overflowX: 'auto'
    },
    table: { 
      width: '100%', 
      borderCollapse: 'collapse',
      minWidth: '700px'
    },
    th: {
      textAlign: 'left',
      padding: '10px',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#e9ecef',
      color: theme === 'dark' ? '#eee' : '#333',
      borderBottom: `2px solid ${theme === 'dark' ? '#444' : '#dee2e6'}`
    },
    td: {
      padding: '8px',
      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
      color: theme === 'dark' ? '#ccc' : '#555'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold'
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
      borderRadius: '4px'
    },
    empty: { 
      textAlign: 'center', 
      padding: '40px', 
      color: 'var(--text-secondary)' 
    },
    summary: {
      marginTop: '16px',
      padding: '12px',
      textAlign: 'center',
      fontSize: '12px',
      color: 'var(--text-secondary)',
      borderTop: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading payments...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💰 All Payments</h2>
      
      <div style={styles.filterBar}>
        <span style={styles.filterLabel}>Filter by branch:</span>
        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} style={styles.select}>
          <option value="all">All Branches</option>
          {branches.map(b => (
            <option key={b.id || b._id} value={b.id || b._id}>{b.name}</option>
          ))}
        </select>
      </div>
      
      <div style={styles.revenue}>
        Total Revenue: {currency}{totalRevenue.toLocaleString()}
      </div>
      
      {payments.length === 0 ? (
        <div style={styles.empty}>
          <p>No payments found for the selected branch.</p>
        </div>
      ) : (
        <>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Plan</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Payment Method</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Branch</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td style={styles.td}>{formatDate(payment.createdAt || payment.paymentDate)}</td>
                    <td style={styles.td}>
                      <strong>{payment.userName}</strong>
                      {payment.userEmail !== 'N/A' && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {payment.userEmail}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>{payment.planName}</td>
                    <td style={styles.td}>
                      <strong>{currency}{payment.amount.toLocaleString()}</strong>
                    </td>
                    <td style={styles.td}>{payment.paymentMethod}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        ...getStatusBadgeStyle(payment.status)
                      }}>
                        {payment.status}
                      </span>
                    </td>
                    <td style={styles.td}>{getBranchName(payment.branchId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={styles.summary}>
            Showing {payments.length} transaction(s) | Total: {currency}{totalRevenue.toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}

export default ManagePayments;