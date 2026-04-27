import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUserPayments } from '../../services/paymentService';
import { getCurrencySymbol } from '../../utils/currency';

function PaymentsHistory() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');

  // Load currency symbol
  useEffect(() => {
    const loadCurrency = async () => {
      const symbol = await getCurrencySymbol();
      setCurrencySymbol(symbol);
    };
    loadCurrency();
  }, []);

  useEffect(() => {
    const loadPayments = async () => {
      if (!token || !user?.id) return;
      
      setLoading(true);
      setError('');
      try {
        const userPayments = await getUserPayments(user.id, token);
        setPayments(userPayments);
      } catch (error) {
        console.error('Error loading payments:', error);
        setError('Failed to load payment history. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadPayments();
  }, [user?.id, token]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'failed':
        return '#f44336';
      case 'refunded':
        return '#9e9e9e';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
      case 'refunded':
        return '↩️';
      default:
        return '📝';
    }
  };

  const styles = {
    container: {
      backgroundColor: 'var(--card-bg)',
      padding: '16px',
      borderRadius: '8px'
    },
    title: {
      color: 'var(--text-primary)',
      marginBottom: '16px'
    },
    tableWrapper: {
      overflowX: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: '10px',
      backgroundColor: 'var(--card-bg)',
      color: theme === 'dark' ? '#eee' : '#333',
      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`
    },
    td: {
      padding: '10px',
      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
      color: 'var(--text-secondary)'
    },
    empty: {
      textAlign: 'center',
      color: theme === 'dark' ? '#aaa' : '#666',
      padding: '20px'
    },
    loading: {
      textAlign: 'center',
      padding: '20px',
      color: theme === 'dark' ? '#aaa' : '#666'
    },
    error: {
      textAlign: 'center',
      padding: '20px',
      color: '#f44336'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Payment History</h2>
        <div style={styles.loading}>Loading payment history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Payment History</h2>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💰 Payment History</h2>
      {payments.length === 0 ? (
        <p style={styles.empty}>No payments recorded yet.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table className="responsive-table" style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Plan</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, idx) => (
                <tr key={payment.id || payment._id || idx}>
                  <td data-label="Date" style={styles.td}>{formatDate(payment.paymentDate || payment.createdAt)}</td>
                  <td data-label="Plan" style={styles.td}>{payment.planName || 'N/A'}</td>
                  <td data-label="Type" style={styles.td}>{payment.type || (payment.planId ? 'Membership' : 'Payment')}</td>
                  <td data-label="Amount" style={styles.td}>{currencySymbol}{Number(payment.amount).toLocaleString()}</td>
                  <td data-label="Status" style={styles.td}>
                    <span style={{ color: getStatusColor(payment.status) }}>
                      {getStatusIcon(payment.status)} {payment.status || 'Completed'}
                    </span>
                  </td>
                  <td data-label="Transaction ID" style={styles.td}>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                      {payment.transactionId || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {payments.length > 0 && (
        <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
          Total Payments: {payments.length} | 
          Total Amount: {currencySymbol}{payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default PaymentsHistory;