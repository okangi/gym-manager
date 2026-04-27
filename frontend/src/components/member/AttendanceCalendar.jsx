import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getAttendanceHistory } from '../../services/attendanceService';
import './AttendanceCalendar.css';

function AttendanceCalendar({ userEmail }) {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [attendanceMap, setAttendanceMap] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const attendance = await getAttendanceHistory(token);
        // Filter by user email if needed, or use userId
        const userAttendance = attendance.filter(a => a.userEmail === userEmail || a.userId === userEmail);
        
        const map = {};
        userAttendance.forEach(record => {
          // Use the date from the record (createdAt or date field)
          const dateKey = new Date(record.date || record.createdAt || record.checkInTime).toDateString();
          if (!map[dateKey]) map[dateKey] = [];
          map[dateKey].push({
            time: new Date(record.checkInTime || record.createdAt).toLocaleTimeString(),
            className: record.className || 'General Check-in',
            status: record.status,
            checkInMethod: record.checkInMethod
          });
        });
        setAttendanceMap(map);
      } catch (error) {
        console.error('Error loading attendance:', error);
        // Fallback to localStorage
        const attendance = JSON.parse(localStorage.getItem('gym_attendance') || '[]');
        const userAttendance = attendance.filter(a => a.userId === userEmail);
        const map = {};
        userAttendance.forEach(record => {
          const dateKey = record.date;
          if (!map[dateKey]) map[dateKey] = [];
          map[dateKey].push(record);
        });
        setAttendanceMap(map);
      } finally {
        setLoading(false);
      }
    };
    
    loadAttendance();
  }, [userEmail, token]);

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateKey = date.toDateString();
      if (attendanceMap[dateKey]) {
        return <div className="checkin-dot" />;
      }
    }
    return null;
  };

  const handleDateClick = (value) => {
    setSelectedDate(value);
    const dateKey = value.toDateString();
    const details = attendanceMap[dateKey] || [];
    setSelectedDetails(details);
  };

  const calendarClass = theme === 'dark' ? 'dark-calendar' : 'light-calendar';

  const styles = {
    container: {
      marginTop: '24px',
      padding: '16px',
      borderRadius: '8px',
    },
    title: {
      marginBottom: '16px',
      fontWeight: 'bold',
    },
    details: {
      marginTop: '16px',
      padding: '12px',
      borderRadius: '8px',
      backgroundColor: 'inherit',
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h3 style={{ ...styles.title, color: 'var(--text-primary)' }}>
          Check‑in History
        </h3>
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading attendance data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={{ ...styles.title, color: 'var(--text-primary)' }}>
        Check‑in History
      </h3>
      <Calendar
        onChange={handleDateClick}
        value={selectedDate}
        tileContent={tileContent}
        className={calendarClass}
      />
      {selectedDetails && selectedDetails.length > 0 && (
        <div style={styles.details}>
          <h4 style={{ color: theme === 'dark' ? '#ddd' : '#333' }}>
            Check‑ins on {selectedDate.toDateString()}
          </h4>
          <ul style={{ color: 'var(--text-secondary)', listStyle: 'none', padding: 0 }}>
            {selectedDetails.map((record, idx) => (
              <li key={idx} style={{ padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 'bold' }}>{record.time}</span>
                {record.className && record.className !== 'General Check-in' && (
                  <> - {record.className}</>
                )}
                {record.status && (
                  <span style={{ 
                    marginLeft: '8px', 
                    color: record.status === 'Present' ? '#4caf50' : '#ff9800',
                    fontSize: '12px'
                  }}>
                    ({record.status})
                  </span>
                )}
                {record.checkInMethod && (
                  <span style={{ marginLeft: '8px', fontSize: '11px', color: '#888' }}>
                    via {record.checkInMethod}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedDetails && selectedDetails.length === 0 && (
        <div style={styles.details}>
          <h4 style={{ color: theme === 'dark' ? '#ddd' : '#333' }}>
            No check‑ins on {selectedDate.toDateString()}
          </h4>
        </div>
      )}
    </div>
  );
}

export default AttendanceCalendar;