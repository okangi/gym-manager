import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getTrainers } from '../../services/trainerService';

function TrainersList() {
  const { user, token } = useAuth(); // Add token
  const { theme } = useTheme();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTrainers = async () => {
      // Check if user is logged in
      if (!token) {
        console.log('No token, skipping trainer load');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError('');
      
      try {
        // Get all trainers (API returns all trainers)
        const allTrainers = await getTrainers(token);
        
        // Ensure allTrainers is an array
        const trainersArray = Array.isArray(allTrainers) ? allTrainers : [];
        
        // Filter by branch if user has a branch
        let filteredTrainers = trainersArray;
        if (user?.branchId) {
          filteredTrainers = trainersArray.filter(t => t.branchId === user.branchId);
        }
        
        // Filter only active trainers
        const activeTrainers = filteredTrainers.filter(t => t.isActive !== false);
        
        setTrainers(activeTrainers);
      } catch (error) {
        console.error('Error loading trainers:', error);
        setError('Failed to load trainers. Please try again.');
        setTrainers([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadTrainers();
  }, [token, user?.branchId]); // Add token to dependencies

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    list: { display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' },
    card: {
      padding: '16px',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '8px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`,
      color: theme === 'dark' ? '#eee' : '#333'
    },
    name: { margin: '0 0 8px 0', color: theme === 'dark' ? '#fff' : '#1877f2' },
    detail: { margin: '4px 0', fontSize: '14px' },
    loading: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' },
    error: { textAlign: 'center', padding: '20px', color: '#f44336' },
    empty: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Our Trainers</h2>
        <div style={styles.loading}>Loading trainers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Our Trainers</h2>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🏋️ Our Trainers</h2>
      {trainers.length === 0 ? (
        <div style={styles.empty}>
          No trainers available at the moment.
        </div>
      ) : (
        <div style={styles.list}>
          {trainers.map(trainer => (
            <div key={trainer.id || trainer._id} style={styles.card}>
              <h3 style={styles.name}>{trainer.name}</h3>
              <p style={styles.detail}>
                <strong>Specialty:</strong> {trainer.specialty || trainer.specialization || 'General Fitness'}
              </p>
              {trainer.bio && <p style={styles.detail}>{trainer.bio}</p>}
              <p style={styles.detail}><strong>Email:</strong> {trainer.email}</p>
              <p style={styles.detail}>
                <strong>Phone:</strong> {trainer.phone || trainer.phoneNumber || 'Not provided'}
              </p>
              {trainer.experience && (
                <p style={styles.detail}><strong>Experience:</strong> {trainer.experience} years</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TrainersList;