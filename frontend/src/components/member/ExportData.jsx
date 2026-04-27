import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { convertToCSV, downloadCSV } from '../../utils/csvExport';
import { addActivityLog, getUserLogs } from '../../services/activityLogger';

function ExportData() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleExportActivity = async () => {
    if (!token) {
      setError('Please login to export data');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (!user?.email) {
      setError('User email not found');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setExporting(true);
    setError('');
    setSuccess('');
    
    try {
      // Fetch logs using email
      const logs = await getUserLogs(user.email, token);
      
      // Ensure logs is an array
      const logsArray = Array.isArray(logs) ? logs : [];
      
      if (logsArray.length === 0) {
        setError('No activity logs found to export');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      // Define CSV columns
      const columns = [
        { label: 'Date', key: 'date' },
        { label: 'Time', key: 'time' },
        { label: 'Action', key: 'action' },
        { label: 'Details', key: 'details' }
      ];
      
      // Format logs for CSV
      const formattedLogs = logsArray.map(log => ({
        date: new Date(log.timestamp).toLocaleDateString(),
        time: new Date(log.timestamp).toLocaleTimeString(),
        action: log.action,
        details: log.details || ''
      }));
      
      // Generate CSV and download
      const csv = convertToCSV(formattedLogs, columns);
      const filename = `my_activity_${user.email}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
      downloadCSV(csv, filename);
      
      // Log the export action
      await addActivityLog(user.email, 'Export Data', `Exported ${logsArray.length} activity records`, token);
      
      setSuccess(`✅ Successfully exported ${logsArray.length} activity records!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError(`❌ ${error.message || 'Error exporting data. Please try again.'}`);
      setTimeout(() => setError(''), 3000);
    } finally {
      setExporting(false);
    }
  };

  const styles = {
    container: {
      padding: '20px',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '8px'
    },
    title: { 
      color: 'var(--text-primary)', 
      marginBottom: '20px' 
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      opacity: exporting ? 0.7 : 1,
      transition: 'opacity 0.2s'
    },
    helperText: {
      marginTop: '12px',
      fontSize: '12px',
      color: 'var(--text-secondary)'
    },
    success: {
      marginTop: '12px',
      padding: '10px',
      backgroundColor: '#d4edda',
      color: '#155724',
      borderRadius: '4px',
      fontSize: '14px'
    },
    error: {
      marginTop: '12px',
      padding: '10px',
      backgroundColor: '#f8d7da',
      color: '#721c24',
      borderRadius: '4px',
      fontSize: '14px'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📥 Export My Activity</h2>
      
      <button 
        onClick={handleExportActivity} 
        style={styles.button}
        disabled={exporting}
      >
        {exporting ? '⏳ Exporting...' : '📥 Download Activity Log (CSV)'}
      </button>
      
      <p style={styles.helperText}>
        Export your personal activity log as a CSV file. This includes all your check-ins, class bookings, 
        payments, and other activities.
      </p>
      
      {success && <div style={styles.success}>{success}</div>}
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

export default ExportData;