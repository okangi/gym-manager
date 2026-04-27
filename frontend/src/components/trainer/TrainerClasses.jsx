import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getClasses, updateClass } from '../../services/classService';
import { addActivityLog } from '../../services/activityLogger';

function TrainerClasses() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [classes, setClasses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ time: '', capacity: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClasses();
  }, [user?.id, user?.branchId, token]);

  const loadClasses = async () => {
    if (!token || !user?.id) return;
    setLoading(true);
    setError('');
    try {
      const allClasses = await getClasses();
      // Filter classes for this trainer (by trainerId) and same branch
      const myClasses = allClasses.filter(c => 
        c.trainerId === user.id && 
        c.branchId === user.branchId
      );
      setClasses(myClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load classes. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cls) => {
    setEditingId(cls.id || cls._id);
    setFormData({ 
      time: cls.time, 
      capacity: cls.capacity 
    });
  };

  const handleSave = async (id) => {
    setSaving(true);
    try {
      const updateData = {
        time: formData.time,
        capacity: parseInt(formData.capacity)
      };
      await updateClass(id, updateData, token);
      await addActivityLog(user?.email, 'Class Edit', `Updated class time/capacity`, token);
      await loadClasses();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating class:', error);
      setError('Failed to update class. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const formatDayName = (day) => {
    if (!day) return 'TBD';
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    loadingContainer: {
      textAlign: 'center',
      padding: '40px',
      color: 'var(--text-secondary)'
    },
    errorText: {
      textAlign: 'center',
      padding: '12px',
      marginBottom: '16px',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      color: '#f44336',
      borderRadius: '4px'
    },
    classCard: {
      padding: '16px',
      marginBottom: '12px',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '8px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`,
      color: theme === 'dark' ? '#eee' : '#333'
    },
    className: {
      margin: '0 0 12px 0',
      color: theme === 'dark' ? '#fff' : '#1877f2'
    },
    label: { 
      fontWeight: 'bold', 
      marginRight: '8px', 
      color: 'var(--text-secondary)' 
    },
    value: {
      color: 'var(--text-primary)'
    },
    infoRow: {
      marginBottom: '8px'
    },
    input: {
      padding: '6px',
      marginRight: '8px',
      borderRadius: '4px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    button: {
      padding: '6px 12px',
      marginRight: '8px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'opacity 0.2s'
    },
    cancelButton: { 
      backgroundColor: '#6c757d' 
    },
    saveButton: {
      backgroundColor: '#28a745'
    },
    buttonGroup: {
      marginTop: '12px',
      display: 'flex',
      gap: '8px'
    },
    editGroup: {
      marginTop: '12px',
      padding: '12px',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#f8f9fa',
      borderRadius: '6px'
    },
    emptyText: {
      textAlign: 'center',
      padding: '40px',
      color: theme === 'dark' ? '#aaa' : '#666'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>My Classes</h2>
        <div style={styles.loadingContainer}>Loading your classes...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📚 My Classes</h2>
      
      {error && <div style={styles.errorText}>{error}</div>}
      
      {classes.length === 0 ? (
        <div style={styles.emptyText}>
          No classes assigned to you yet. Contact your administrator for class assignments.
        </div>
      ) : (
        classes.map(cls => (
          <div key={cls.id || cls._id} style={styles.classCard}>
            <h3 style={styles.className}>{cls.name}</h3>
            
            <div style={styles.infoRow}>
              <span style={styles.label}>Day:</span>
              <span style={styles.value}>{formatDayName(cls.day)}</span>
            </div>
            
            <div style={styles.infoRow}>
              <span style={styles.label}>Duration:</span>
              <span style={styles.value}>{cls.duration || 60} minutes</span>
            </div>
            
            {editingId === (cls.id || cls._id) ? (
              <div style={styles.editGroup}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Time:</span>
                  <input 
                    type="time" 
                    value={formData.time} 
                    onChange={e => setFormData({ ...formData, time: e.target.value })} 
                    style={styles.input} 
                  />
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Capacity:</span>
                  <input 
                    type="number" 
                    value={formData.capacity} 
                    onChange={e => setFormData({ ...formData, capacity: e.target.value })} 
                    style={styles.input} 
                    min="1"
                    max="100"
                  />
                </div>
                <div style={styles.buttonGroup}>
                  <button 
                    onClick={() => handleSave(cls.id || cls._id)} 
                    style={{ ...styles.button, ...styles.saveButton }}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => setEditingId(null)} 
                    style={{ ...styles.button, ...styles.cancelButton }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Time:</span>
                  <span style={styles.value}>{cls.time}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Capacity:</span>
                  <span style={styles.value}>{cls.capacity} spots</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Enrolled:</span>
                  <span style={styles.value}>{cls.currentEnrollment || 0} / {cls.capacity}</span>
                </div>
                <button 
                  onClick={() => handleEdit(cls)} 
                  style={styles.button}
                >
                  ✏️ Edit Time/Capacity
                </button>
              </>
            )}
          </div>
        ))
      )}
      
      {classes.length > 0 && (
        <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Total classes: {classes.length}
        </div>
      )}
    </div>
  );
}

export default TrainerClasses;