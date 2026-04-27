import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getUsers } from '../../services/userService';
import { getPayments } from '../../services/paymentService';
import { getClasses } from '../../services/classService';
import { getBookings } from '../../services/bookingService';
import { getAttendanceHistory } from '../../services/attendanceService';
import { getTrainers } from '../../services/trainerService';
import { getPlans } from '../../services/planService';
import { getNotifications } from '../../services/notificationService';
import { getProgressEntries } from '../../services/progressService';
import { getChatMessages } from '../../services/chatService';
import { getPrivateSessions } from '../../services/privateSessionService';
import { getBranches } from '../../services/branchService';

function ExportAllData() {
  const { theme, token, user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [error, setError] = useState('');

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return null;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ];
    return csvRows.join('\n');
  };

  const fetchAllData = async () => {
    setError('');
    setExportProgress('Fetching users...');
    
    try {
      // Fetch all data in parallel for better performance
      const [
        users,
        payments,
        classes,
        bookings,
        attendance,
        trainers,
        plans,
        notifications,
        progressEntries,
        chatMessages,
        privateSessions,
        branches
      ] = await Promise.allSettled([ // Use allSettled to handle individual failures
        getUsers(token),
        getPayments(token),
        getClasses(),
        getBookings(token),
        getAttendanceHistory(token),
        getTrainers(token),
        getPlans(),
        getNotifications(token),
        (async () => {
          setExportProgress('Fetching progress entries...');
          return await getProgressEntries(user?.id, token);
        })(),
        (async () => {
          setExportProgress('Fetching chat messages...');
          const messages = await getChatMessages(user?.id, token);
          return Array.isArray(messages) ? messages : [];
        })(),
        (async () => {
          setExportProgress('Fetching private sessions...');
          const sessions = await getPrivateSessions(user?.id, token);
          return Array.isArray(sessions) ? sessions : [];
        })(),
        getBranches()
      ]);
      
      // Handle results, using empty arrays for failed requests
      const result = {
        users: users.status === 'fulfilled' ? (Array.isArray(users.value) ? users.value : []) : [],
        payments: payments.status === 'fulfilled' ? (Array.isArray(payments.value) ? payments.value : []) : [],
        classes: classes.status === 'fulfilled' ? (Array.isArray(classes.value) ? classes.value : classes.value?.classes || []) : [],
        bookings: bookings.status === 'fulfilled' ? (Array.isArray(bookings.value) ? bookings.value : []) : [],
        attendance: attendance.status === 'fulfilled' ? (Array.isArray(attendance.value) ? attendance.value : attendance.value?.attendance || []) : [],
        trainers: trainers.status === 'fulfilled' ? (Array.isArray(trainers.value) ? trainers.value : trainers.value?.trainers || []) : [],
        plans: plans.status === 'fulfilled' ? (Array.isArray(plans.value) ? plans.value : plans.value?.plans || []) : [],
        notifications: notifications.status === 'fulfilled' ? (Array.isArray(notifications.value) ? notifications.value : notifications.value?.notifications || []) : [],
        progressEntries: progressEntries.status === 'fulfilled' ? (Array.isArray(progressEntries.value) ? progressEntries.value : []) : [],
        chatMessages: chatMessages.status === 'fulfilled' ? (Array.isArray(chatMessages.value) ? chatMessages.value : []) : [],
        privateSessions: privateSessions.status === 'fulfilled' ? (Array.isArray(privateSessions.value) ? privateSessions.value : []) : [],
        branches: branches.status === 'fulfilled' ? (Array.isArray(branches.value) ? branches.value : branches.value?.branches || []) : []
      };
      
      return result;
    } catch (err) {
      console.error('Error fetching data:', err);
      throw err;
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    setError('');
    setExportProgress('Starting export...');

    const zip = new JSZip();

    try {
      const data = await fetchAllData();
      
      // Count total records for summary
      let totalRecords = 0;
      const exports = [
        { name: 'users', data: data.users, label: 'Users' },
        { name: 'payments', data: data.payments, label: 'Payments' },
        { name: 'classes', data: data.classes, label: 'Classes' },
        { name: 'bookings', data: data.bookings, label: 'Bookings' },
        { name: 'attendance', data: data.attendance, label: 'Attendance' },
        { name: 'trainers', data: data.trainers, label: 'Trainers' },
        { name: 'plans', data: data.plans, label: 'Plans' },
        { name: 'notifications', data: data.notifications, label: 'Notifications' },
        { name: 'progress_entries', data: data.progressEntries, label: 'Progress' },
        { name: 'chat_messages', data: data.chatMessages, label: 'Chat Messages' },
        { name: 'private_sessions', data: data.privateSessions, label: 'Private Sessions' },
        { name: 'branches', data: data.branches, label: 'Branches' }
      ];
      
      for (const exp of exports) {
        if (exp.data?.length) {
          setExportProgress(`Exporting ${exp.label} (${exp.data.length} records)...`);
          const csv = exportToCSV(exp.data);
          if (csv) {
            zip.file(`${exp.name}.csv`, csv);
            totalRecords += exp.data.length;
          }
        }
      }

      setExportProgress('Generating ZIP file...');
      
      // Generate and download ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const filename = `gym_data_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`;
      saveAs(content, filename);
      
      setExportProgress(`Export complete! ${totalRecords} total records exported.`);
      setTimeout(() => setExportProgress(''), 3000);
      
    } catch (err) {
      console.error('Export error:', err);
      setError('Error exporting data. Please try again.');
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
      padding: '12px 24px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
      opacity: exporting ? 0.7 : 1,
      transition: 'opacity 0.2s'
    },
    buttonDisabled: {
      cursor: 'not-allowed'
    },
    progress: { 
      marginTop: '16px', 
      color: theme === 'dark' ? '#4caf50' : '#2e7d32',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    message: { 
      marginTop: '12px', 
      color: theme === 'dark' ? '#aaa' : '#666',
      fontSize: '12px'
    },
    error: { 
      marginTop: '16px', 
      color: '#dc3545', 
      textAlign: 'center',
      padding: '10px',
      backgroundColor: theme === 'dark' ? '#2a1a1a' : '#ffebee',
      borderRadius: '4px'
    },
    success: {
      marginTop: '16px',
      color: '#4caf50',
      textAlign: 'center',
      padding: '10px',
      backgroundColor: theme === 'dark' ? '#1a2a1a' : '#e8f5e9',
      borderRadius: '4px'
    },
    spinner: {
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid #4caf50',
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  // Add keyframe animation for spinner
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📥 Export All Data</h2>
      
      <button 
        onClick={handleExportAll} 
        disabled={exporting} 
        style={{
          ...styles.button,
          ...(exporting ? styles.buttonDisabled : {})
        }}
      >
        {exporting ? '⏳ Exporting...' : '📦 Download All Data (ZIP)'}
      </button>
      
      {exportProgress && (
        <div style={styles.progress}>
          <div style={styles.spinner}></div>
          {exportProgress}
        </div>
      )}
      
      <p style={styles.message}>
        Exports all gym data (users, payments, classes, bookings, attendance, trainers, 
        plans, notifications, progress, chat messages, private sessions, and branches) 
        as CSV files inside a ZIP archive.
      </p>
      
      <p style={{ ...styles.message, fontSize: '11px', marginTop: '8px' }}>
        ⚡ This may take a few moments depending on the amount of data.
      </p>
      
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

export default ExportAllData;