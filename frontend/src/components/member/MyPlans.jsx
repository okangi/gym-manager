import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUserPlans, completeExercise } from '../../services/planAssignmentService';

function MyPlans() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [plans, setPlans] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlans();
  }, [user?.id, token]);

  const loadPlans = async () => {
    if (!token || !user?.id) return;
    setLoading(true);
    setError('');
    try {
      const memberPlans = await getUserPlans(user.id, token);
      console.log('Member plans loaded:', memberPlans.length);
      setPlans(memberPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      setError('Failed to load your plans. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteExercise = async (planId, exerciseIndex) => {
    if (updating) return;
    setUpdating(true);
    try {
      await completeExercise(planId, exerciseIndex, token);
      await loadPlans(); // Refresh plans after completion
    } catch (error) {
      console.error('Error completing exercise:', error);
      alert('Failed to mark exercise as complete. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const tasksForDate = plans.filter(plan => plan.dueDate === selectedDate);
  const pendingTasksForDate = tasksForDate.filter(plan => 
    plan.exercises?.some(ex => !ex.completed)
  );

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    subtitle: { color: 'var(--text-secondary)', marginBottom: '16px' },
    calendar: { 
      marginBottom: '20px', 
      padding: '16px', 
      backgroundColor: 'var(--card-bg)', 
      borderRadius: '8px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`
    },
    planCard: { 
      padding: '16px', 
      marginBottom: '16px', 
      backgroundColor: 'var(--card-bg)', 
      borderRadius: '8px', 
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`,
      color: theme === 'dark' ? '#eee' : '#333'
    },
    planHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px',
      flexWrap: 'wrap'
    },
    planType: {
      fontSize: '12px',
      padding: '2px 8px',
      borderRadius: '4px',
      backgroundColor: '#1877f2',
      color: 'white'
    },
    exerciseItem: { 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '8px', 
      borderBottom: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`,
      color: theme === 'dark' ? '#eee' : '#333'
    },
    completeButton: { 
      padding: '4px 12px', 
      backgroundColor: '#28a745', 
      color: 'white', 
      border: 'none', 
      borderRadius: '4px', 
      cursor: 'pointer',
      opacity: updating ? 0.7 : 1
    },
    completed: { 
      textDecoration: 'line-through', 
      color: theme === 'dark' ? '#aaa' : '#888' 
    },
    commentSection: { 
      marginTop: '12px', 
      padding: '12px', 
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#f8f9fa', 
      borderRadius: '8px',
      borderLeft: `3px solid #1877f2`
    },
    commentItem: {
      padding: '8px',
      marginBottom: '8px',
      borderBottom: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#e0e0e0'}`,
      fontSize: '14px'
    },
    commentText: { margin: '4px 0' },
    commentMeta: { fontSize: '11px', color: '#888', marginTop: '4px' },
    progressBar: { 
      width: '100%', 
      backgroundColor: theme === 'dark' ? '#2a4a6e' : '#e0e0e0', 
      borderRadius: '4px', 
      marginBottom: '12px',
      overflow: 'hidden'
    },
    progressFill: { 
      height: '8px', 
      backgroundColor: '#4caf50', 
      transition: 'width 0.3s ease'
    },
    emptyText: {
      textAlign: 'center',
      padding: '40px',
      color: theme === 'dark' ? '#aaa' : '#666'
    },
    loadingText: {
      textAlign: 'center',
      padding: '40px',
      color: theme === 'dark' ? '#aaa' : '#666'
    },
    errorText: {
      textAlign: 'center',
      padding: '20px',
      color: '#f44336'
    },
    dateInput: { 
      marginLeft: '10px', 
      padding: '6px', 
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', 
      color: theme === 'dark' ? '#eee' : '#333', 
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`, 
      borderRadius: '4px' 
    },
    smallText: {
      fontSize: '12px',
      color: theme === 'dark' ? '#aaa' : '#666'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>My Workout & Nutrition Plans</h2>
        <div style={styles.loadingText}>Loading your plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>My Plans</h2>
        <div style={styles.errorText}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>My Workout & Nutrition Plans</h2>
      
      {/* Calendar / Daily Tasks */}
      <div style={styles.calendar}>
        <label><strong>📅 Tasks due on:</strong></label>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={e => setSelectedDate(e.target.value)} 
          style={styles.dateInput}
        />
        {pendingTasksForDate.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <h4 style={{ color: 'var(--text-primary)' }}>Pending Tasks for {selectedDate}</h4>
            {pendingTasksForDate.map(plan => (
              <div key={plan.id}>
                <strong>{plan.title}</strong>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  {plan.exercises?.map((ex, idx) => !ex.completed && (
                    <li key={idx} style={{ color: 'var(--text-secondary)' }}>{ex.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {pendingTasksForDate.length === 0 && tasksForDate.length > 0 && (
          <p style={styles.smallText}>🎉 All tasks completed for this date!</p>
        )}
        {tasksForDate.length === 0 && (
          <p style={styles.smallText}>No tasks due on this date.</p>
        )}
      </div>

      {plans.length === 0 ? (
        <div style={styles.emptyText}>
          <p>No plans assigned yet.</p>
          <p style={styles.smallText}>Your trainer will create workout or nutrition plans for you.</p>
        </div>
      ) : (
        plans.map(plan => {
          const progress = plan.progress || 0;
          return (
            <div key={plan.id} style={styles.planCard}>
              <div style={styles.planHeader}>
                <h3 style={{ margin: 0 }}>{plan.title}</h3>
                <span style={styles.planType}>
                  {plan.type === 'workout' ? '💪 Workout Plan' : '🥗 Nutrition Plan'}
                </span>
              </div>
              
              <p><strong>📅 Created:</strong> {new Date(plan.createdAt).toLocaleDateString()}</p>
              {plan.dueDate && <p><strong>⏰ Due:</strong> {new Date(plan.dueDate).toLocaleDateString()}</p>}
              
              {/* Progress Bar */}
              <div>
                <strong>Progress: {progress}%</strong>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                </div>
              </div>

              {/* Exercises List */}
              <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>
                {plan.type === 'workout' ? '🏋️ Exercises' : '🍽️ Meal Plan'}
              </h4>
              {plan.exercises && plan.exercises.map((ex, idx) => (
                <div key={idx} style={styles.exerciseItem}>
                  <div>
                    <span className={ex.completed ? styles.completed : ''}>
                      {ex.name}
                    </span>
                    {ex.notes && <div style={styles.smallText}>{ex.notes}</div>}
                  </div>
                  {!ex.completed && (
                    <button 
                      onClick={() => handleCompleteExercise(plan.id, idx)} 
                      style={styles.completeButton}
                      disabled={updating}
                    >
                      ✓ Mark Done
                    </button>
                  )}
                  {ex.completed && (
                    <span style={{ color: '#4caf50', fontSize: '14px' }}>✓ Completed</span>
                  )}
                </div>
              ))}

              {/* Trainer Comments Section */}
              {plan.trainerComments && plan.trainerComments.length > 0 && (
                <div style={styles.commentSection}>
                  <strong>💬 Trainer Feedback</strong>
                  <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {plan.trainerComments.map((comment, idx) => (
                      <div key={idx} style={styles.commentItem}>
                        <div style={styles.commentText}>
                          <strong>{comment.trainerName}:</strong> {comment.text}
                        </div>
                        <div style={styles.commentMeta}>
                          {new Date(comment.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default MyPlans;