import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getAllPayments } from '../../services/paymentService';
import { getUsers } from '../../services/userService';
import { getBranches } from '../../services/branchService';
import { getActiveMembership } from '../../services/membershipService';
import { convertToCSV, downloadCSV } from '../../utils/csvExport';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getCurrencySymbol } from '../../utils/currency';

function RevenueChart() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [view, setView] = useState('monthly');
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('line');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({
    totalMembers: 0,
    activeMemberships: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });

  // Load currency symbol
  useEffect(() => {
    const loadCurrency = async () => {
      const symbol = await getCurrencySymbol();
      setCurrencySymbol(symbol);
    };
    loadCurrency();
    
    const handleSettingsUpdate = async () => {
      const symbol = await getCurrencySymbol();
      setCurrencySymbol(symbol);
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const allBranches = await getBranches();
        setBranches(allBranches.filter(b => b.isActive !== false));
      } catch (err) {
        console.error('Error loading branches:', err);
      }
    };
    loadBranches();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedBranch, view, token]);

  const loadData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Fetch data in parallel for better performance
      const [usersData, paymentsData] = await Promise.all([
        getUsers(token),
        getAllPayments(token)
      ]);
      
      const usersArray = Array.isArray(usersData) ? usersData : [];
      const paymentsArray = Array.isArray(paymentsData) ? paymentsData : [];
      
      // Create user maps for quick lookup
      const userMap = new Map();
      const userByEmailMap = new Map();
      
      usersArray.forEach(user => {
        const userId = user.id || user._id;
        userMap.set(userId, user);
        if (user.email) {
          userByEmailMap.set(user.email.toLowerCase(), user);
        }
      });
      
      // Filter by branch if needed
      let filteredUsers = usersArray;
      let filteredPayments = paymentsArray;
      
      if (selectedBranch !== 'all') {
        filteredUsers = usersArray.filter(u => u.branchId === selectedBranch);
        
        // OPTIMIZED: Create a Set of user IDs for faster lookup
        const userIdsInBranch = new Set(filteredUsers.map(u => u.id || u._id));
        const userEmailsInBranch = new Set(filteredUsers.map(u => u.email?.toLowerCase()).filter(Boolean));
        
        filteredPayments = paymentsArray.filter(payment => {
          // Check by user ID
          if (payment.userId && userIdsInBranch.has(payment.userId)) {
            return true;
          }
          // Check by email
          if (payment.userEmail && userEmailsInBranch.has(payment.userEmail.toLowerCase())) {
            return true;
          }
          return false;
        });
      }
      
      // Calculate chart data (this is fast, operates on arrays)
      const newChartData = view === 'weekly' 
        ? aggregateWeekly(filteredPayments)
        : aggregateMonthly(filteredPayments);
      setChartData(newChartData);
      
      // Calculate metrics efficiently
      const members = filteredUsers.filter(u => u.role === 'member');
      const totalMembers = members.length;
      const totalRevenue = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // OPTIMIZED: Calculate monthly revenue without creating intermediate arrays
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      let monthlyRevenue = 0;
      for (const payment of filteredPayments) {
        const date = new Date(payment.paymentDate || payment.createdAt);
        if (!isNaN(date.getTime()) && 
            date.getMonth() === currentMonth && 
            date.getFullYear() === currentYear) {
          monthlyRevenue += payment.amount || 0;
        }
      }
      
      // OPTIMIZED: Calculate active memberships in a single batch
      // Instead of individual API calls, we could have a bulk endpoint, but for now:
      let activeCount = 0;
      // Limit to first 50 to prevent too many API calls
      const membersToCheck = members.slice(0, 50);
      
      for (const user of membersToCheck) {
        try {
          const userId = user.id || user._id;
          const membership = await getActiveMembership(userId, token);
          if (membership && membership.status === 'active') {
            activeCount++;
          }
        } catch (err) {
          console.error(`Error checking membership for ${user.email}:`, err);
        }
      }
      
      setMetrics({
        totalMembers,
        activeMemberships: activeCount,
        totalRevenue,
        monthlyRevenue
      });
      
    } catch (error) {
      console.error('Error loading revenue data:', error);
      setError('Failed to load revenue data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const aggregateWeekly = (payments) => {
    const weeks = new Map(); // Use Map for better performance
    for (const payment of payments) {
      const date = new Date(payment.paymentDate || payment.createdAt);
      if (isNaN(date.getTime())) continue;
      
      const year = date.getFullYear();
      const weekNumber = getWeekNumber(date);
      const key = `${year}-W${weekNumber}`;
      
      const current = weeks.get(key) || { week: key, revenue: 0 };
      current.revenue += payment.amount || 0;
      weeks.set(key, current);
    }
    return Array.from(weeks.values()).sort((a, b) => a.week.localeCompare(b.week));
  };

  const aggregateMonthly = (payments) => {
    const months = new Map(); // Use Map for better performance
    for (const payment of payments) {
      const date = new Date(payment.paymentDate || payment.createdAt);
      if (isNaN(date.getTime())) continue;
      
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const current = months.get(monthYear) || { month: monthYear, revenue: 0 };
      current.revenue += payment.amount || 0;
      months.set(monthYear, current);
    }
    return Array.from(months.values());
  };

  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const handleExportMetrics = () => {
    const metricsData = [
      { Metric: 'Total Members', Value: metrics.totalMembers },
      { Metric: 'Active Memberships', Value: metrics.activeMemberships },
      { Metric: 'Total Revenue', Value: `${currencySymbol}${metrics.totalRevenue.toLocaleString()}` },
      { Metric: 'Monthly Revenue', Value: `${currencySymbol}${metrics.monthlyRevenue.toLocaleString()}` },
      { Metric: 'Branch', Value: selectedBranch === 'all' ? 'All Branches' : branches.find(b => (b.id || b._id) === selectedBranch)?.name || 'Unknown' },
      { Metric: 'Generated At', Value: new Date().toLocaleString() }
    ];
    const csv = convertToCSV(metricsData, [
      { label: 'Metric', key: 'Metric' },
      { label: 'Value', key: 'Value' }
    ]);
    downloadCSV(csv, `revenue_metrics_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportChartData = () => {
    if (!chartData || chartData.length === 0) {
      alert('No chart data to export');
      return;
    }
    const columns = view === 'weekly'
      ? [{ label: 'Week', key: 'week' }, { label: 'Revenue', key: 'revenue' }]
      : [{ label: 'Month', key: 'month' }, { label: 'Revenue', key: 'revenue' }];
    const csv = convertToCSV(chartData, columns);
    downloadCSV(csv, `${view}_revenue_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const chartColors = {
    line: theme === 'dark' ? '#4caf50' : '#1877f2',
    grid: theme === 'dark' ? '#444' : '#ddd',
    text: theme === 'dark' ? '#eee' : '#333'
  };
  const cardBg = theme === 'dark' ? '#0f3460' : '#f8f9fa';
  const cardText = theme === 'dark' ? '#eee' : '#333';

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
    metricsGrid: { display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '30px' },
    card: { padding: '16px', backgroundColor: cardBg, borderRadius: '8px', textAlign: 'center', color: cardText },
    controls: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px', alignItems: 'center' },
    button: { padding: '8px 16px', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', backgroundColor: '#6c757d', transition: 'all 0.2s' },
    activeButton: { backgroundColor: '#1877f2' },
    exportButton: { padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' },
    chartContainer: { 
      width: '100%', 
      height: '400px',
      position: 'relative'
    },
    chartWrapper: {
      width: '100%',
      height: '100%',
      minHeight: '400px'
    },
    loading: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' },
    error: { textAlign: 'center', padding: '20px', color: '#f44336', backgroundColor: theme === 'dark' ? '#2a1a1a' : '#ffebee', borderRadius: '4px' }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Revenue Dashboard</h2>
        <div style={styles.loading}>
          <div>Loading revenue data...</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>This may take a moment</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Revenue Dashboard</h2>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Revenue Dashboard</h2>
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No revenue data available for the selected period.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Revenue Dashboard</h2>
      <div style={styles.filterBar}>
        <span style={styles.filterLabel}>Branch:</span>
        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} style={styles.select}>
          <option value="all">All Branches</option>
          {branches.map(b => (
            <option key={b.id || b._id} value={b.id || b._id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      
      <div style={styles.metricsGrid}>
        <div style={styles.card}>
          <h3>Total Members</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{metrics.totalMembers}</p>
        </div>
        <div style={styles.card}>
          <h3>Active Memberships</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{metrics.activeMemberships}</p>
        </div>
        <div style={styles.card}>
          <h3>Total Revenue</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{currencySymbol}{metrics.totalRevenue.toLocaleString()}</p>
        </div>
        <div style={styles.card}>
          <h3>Monthly Revenue</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{currencySymbol}{metrics.monthlyRevenue.toLocaleString()}</p>
        </div>
      </div>
      
      <div style={styles.controls}>
        <div>
          <button 
            onClick={() => setView('weekly')} 
            style={{ ...styles.button, ...(view === 'weekly' && styles.activeButton) }}
          >
            Weekly
          </button>
          <button 
            onClick={() => setView('monthly')} 
            style={{ ...styles.button, ...(view === 'monthly' && styles.activeButton), marginLeft: '8px' }}
          >
            Monthly
          </button>
        </div>
        <div>
          <button 
            onClick={() => setChartType('line')} 
            style={{ ...styles.button, ...(chartType === 'line' && styles.activeButton) }}
          >
            Line Chart
          </button>
          <button 
            onClick={() => setChartType('bar')} 
            style={{ ...styles.button, ...(chartType === 'bar' && styles.activeButton), marginLeft: '8px' }}
          >
            Bar Chart
          </button>
        </div>
        <div>
          <button onClick={handleExportMetrics} style={styles.exportButton}>
            📥 Export Metrics
          </button>
          <button onClick={handleExportChartData} style={{ ...styles.exportButton, marginLeft: '8px' }}>
            📊 Export Chart Data
          </button>
        </div>
      </div>
      
      <div style={styles.chartContainer}>
        <div style={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis 
                  dataKey={view === 'weekly' ? 'week' : 'month'} 
                  stroke={chartColors.text} 
                  tick={{ fill: chartColors.text }}
                  interval={view === 'weekly' ? Math.max(0, Math.floor(chartData.length / 10)) : 0}
                />
                <YAxis 
                  stroke={chartColors.text} 
                  tick={{ fill: chartColors.text }} 
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    borderColor: chartColors.grid,
                    borderRadius: '4px'
                  }} 
                  labelStyle={{ color: chartColors.text }} 
                  formatter={(value) => [`${currencySymbol}${value.toLocaleString()}`, 'Revenue']}
                />
                <Legend wrapperStyle={{ color: chartColors.text }} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={chartColors.line} 
                  strokeWidth={2} 
                  name={`Revenue (${currencySymbol})`}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis 
                  dataKey={view === 'weekly' ? 'week' : 'month'} 
                  stroke={chartColors.text} 
                  tick={{ fill: chartColors.text }}
                  interval={view === 'weekly' ? Math.max(0, Math.floor(chartData.length / 10)) : 0}
                />
                <YAxis 
                  stroke={chartColors.text} 
                  tick={{ fill: chartColors.text }} 
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    borderColor: chartColors.grid,
                    borderRadius: '4px'
                  }} 
                  labelStyle={{ color: chartColors.text }} 
                  formatter={(value) => [`${currencySymbol}${value.toLocaleString()}`, 'Revenue']}
                />
                <Legend wrapperStyle={{ color: chartColors.text }} />
                <Bar 
                  dataKey="revenue" 
                  fill={chartColors.line} 
                  name={`Revenue (${currencySymbol})`}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default RevenueChart;