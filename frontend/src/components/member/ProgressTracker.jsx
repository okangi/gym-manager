import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getProgressEntries, addProgressEntry, deleteProgressEntry } from '../../services/progressService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ProgressTracker() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ date: '', weight: '', bodyFat: '', notes: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadEntries();
  }, [user?.id, token]);

  const loadEntries = async () => {
    if (!token || !user?.id) return;
    setLoading(true);
    try {
      const userEntries = await getProgressEntries(user.id, token);
      // Sort by date (newest first for list, but chart needs chronological order)
      const sorted = [...userEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
      setEntries(sorted);
    } catch (error) {
      console.error('Error loading progress entries:', error);
      setError('Failed to load progress data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.weight) {
      setError('Please fill in date and weight fields.');
      return;
    }
    
    setSubmitting(true);
    setError('');
    try {
      const newEntry = {
        userId: user.id,
        date: formData.date,
        weight: parseFloat(formData.weight),
        bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : null,
        notes: formData.notes
      };
      await addProgressEntry(newEntry, token);
      setFormData({ date: '', weight: '', bodyFat: '', notes: '' });
      await loadEntries();
    } catch (error) {
      console.error('Error adding progress entry:', error);
      setError('Failed to add entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this entry?')) {
      try {
        await deleteProgressEntry(id, token);
        await loadEntries();
      } catch (error) {
        console.error('Error deleting entry:', error);
        setError('Failed to delete entry. Please try again.');
      }
    }
  };

  const chartData = entries.map(e => ({
    date: new Date(e.date).toLocaleDateString(),
    weight: e.weight,
    bodyFat: e.bodyFat
  }));

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    form: { marginBottom: '20px', padding: '16px', backgroundColor: 'var(--card-bg)', borderRadius: '8px' },
    input: { 
      display: 'block', 
      width: '100%', 
      padding: '8px', 
      marginBottom: '10px', 
      borderRadius: '4px', 
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`, 
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', 
      color: theme === 'dark' ? '#eee' : '#333' 
    },
    button: { 
      padding: '8px 16px', 
      backgroundColor: '#1877f2', 
      color: 'white', 
      border: 'none', 
      borderRadius: '4px', 
      cursor: 'pointer',
      opacity: submitting ? 0.7 : 1
    },
    entryCard: { 
      padding: '12px', 
      marginBottom: '8px', 
      backgroundColor: 'var(--card-bg)', 
      borderRadius: '6px', 
      border: '1px solid var(--border-color)', 
      color: theme === 'dark' ? '#eee' : '#333',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    deleteButton: { 
      marginLeft: '10px', 
      backgroundColor: '#dc3545', 
      color: 'white', 
      border: 'none', 
      borderRadius: '4px', 
      padding: '4px 8px', 
      cursor: 'pointer' 
    },
    emptyText: { 
      color: theme === 'dark' ? '#aaa' : '#666', 
      textAlign: 'center', 
      padding: '20px' 
    },
    loadingText: {
      textAlign: 'center',
      padding: '40px',
      color: theme === 'dark' ? '#aaa' : '#666'
    },
    errorText: {
      color: '#f44336',
      textAlign: 'center',
      padding: '10px',
      marginBottom: '10px',
      borderRadius: '4px',
      backgroundColor: 'rgba(244, 67, 54, 0.1)'
    },
    entryContent: {
      flex: 1
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Progress Tracker</h2>
        <div style={styles.loadingText}>Loading your progress data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Progress Tracker</h2>
      {error && <div style={styles.errorText}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <input 
          type="date" 
          name="date" 
          value={formData.date} 
          onChange={e => setFormData({ ...formData, date: e.target.value })} 
          required 
          style={styles.input} 
        />
        <input 
          type="number" 
          step="0.1" 
          placeholder="Weight (kg)" 
          value={formData.weight} 
          onChange={e => setFormData({ ...formData, weight: e.target.value })} 
          required 
          style={styles.input} 
        />
        <input 
          type="number" 
          step="0.1" 
          placeholder="Body Fat % (optional)" 
          value={formData.bodyFat} 
          onChange={e => setFormData({ ...formData, bodyFat: e.target.value })} 
          style={styles.input} 
        />
        <textarea 
          placeholder="Notes (optional)" 
          value={formData.notes} 
          onChange={e => setFormData({ ...formData, notes: e.target.value })} 
          style={styles.input} 
          rows="2" 
        />
        <button type="submit" style={styles.button} disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Entry'}
        </button>
      </form>

      <h3 style={{ color: 'var(--text-primary)' }}>Weight History</h3>
      {entries.length === 0 ? (
        <p style={styles.emptyText}>No progress entries yet. Add your first entry above.</p>
      ) : (
        <>
          <div style={{ height: '300px', marginBottom: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#444' : '#ddd'} />
                <XAxis dataKey="date" stroke={theme === 'dark' ? '#ccc' : '#333'} />
                <YAxis stroke={theme === 'dark' ? '#ccc' : '#333'} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: theme === 'dark' ? '#444' : '#ddd' }} />
                <Legend wrapperStyle={{ color: theme === 'dark' ? '#eee' : '#333' }} />
                <Line type="monotone" dataKey="weight" stroke="#1877f2" strokeWidth={2} name="Weight (kg)" />
                {chartData.some(d => d.bodyFat) && (
                  <Line type="monotone" dataKey="bodyFat" stroke="#4caf50" strokeWidth={2} name="Body Fat %" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <h3 style={{ color: 'var(--text-primary)' }}>All Entries</h3>
          {entries.slice().reverse().map(entry => (
            <div key={entry.id || entry._id} style={styles.entryCard}>
              <div style={styles.entryContent}>
                <strong>{new Date(entry.date).toLocaleDateString()}</strong> – Weight: {entry.weight} kg
                {entry.bodyFat && <span> | Body Fat: {entry.bodyFat}%</span>}
                {entry.notes && <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>📝 {entry.notes}</div>}
                {entry.createdBy && (
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Recorded by: {entry.createdByName || 'Trainer'}
                  </div>
                )}
              </div>
              <button onClick={() => handleDelete(entry.id || entry._id)} style={styles.deleteButton}>Delete</button>
            </div>
          ))}
        </>
      )}
      
      {entries.length > 0 && (
        <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Showing {entries.length} weight {entries.length === 1 ? 'entry' : 'entries'}
        </div>
      )}
    </div>
  );
}

export default ProgressTracker;