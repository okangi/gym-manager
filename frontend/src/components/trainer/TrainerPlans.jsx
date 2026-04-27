import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getTrainerPlans, addTrainerComment, createPlanAssignment, updatePlanAssignment, deletePlanAssignment } from '../../services/planAssignmentService';
import { addActivityLog } from '../../services/activityLogger';

function TrainerPlans() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    type: 'workout',
    memberId: '',
    dueDate: '',
    exercises: [{ name: '', notes: '' }]
  });

  useEffect(() => {
    loadData();
  }, [user?.id, token]);

  const loadData = async () => {
    if (!token || !user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Loading trainer plans for user:', user.id);
      
      // Load plans
      const trainerPlans = await getTrainerPlans(user.id, token);
      console.log('Plans loaded:', trainerPlans.length);
      
      // Log each plan's ID to debug
      trainerPlans.forEach(plan => {
        console.log(`Plan: ${plan.title}, ID: ${plan.id || plan._id}`);
      });
      
      setPlans(trainerPlans);
      
      // Load members from the same branch
      if (user.branchId) {
        const membersResponse = await fetch(`http://localhost:5000/api/users/members/branch/${user.branchId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const membersData = await membersResponse.json();
        
        if (membersData.success) {
          const processedMembers = membersData.users.map(m => ({
            ...m,
            id: m.id || m._id
          }));
          setMembers(processedMembers);
        }
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      title: '',
      type: 'workout',
      memberId: '',
      dueDate: '',
      exercises: [{ name: '', notes: '' }]
    });
    setShowForm(false);
  };

  const handleAddExercise = () => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', notes: '' }]
    }));
  };

  const handleRemoveExercise = (index) => {
    const updated = [...formData.exercises];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, exercises: updated }));
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...formData.exercises];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, exercises: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    const selectedMember = members.find(m => String(m.id) === String(formData.memberId));
    
    if (!selectedMember) {
      setError('Please select a valid member');
      setSaving(false);
      return;
    }
    
    try {
      if (editingPlan) {
        const updatedPlan = {
          ...editingPlan,
          title: formData.title,
          type: formData.type,
          dueDate: formData.dueDate || null,
          exercises: formData.exercises,
        };
        await updatePlanAssignment(editingPlan.id || editingPlan._id, updatedPlan, token);
        await addActivityLog(user?.email, 'Edit Plan', `Updated plan "${formData.title}" for member ${selectedMember.name}`, token);
        alert('Plan updated successfully!');
        resetForm();
      } else {
        const newPlan = {
          trainerId: user.id,
          trainerName: user.name,
          memberId: selectedMember.id,
          memberEmail: selectedMember.email,
          title: formData.title,
          type: formData.type,
          dueDate: formData.dueDate || null,
          exercises: formData.exercises.map(ex => ({ ...ex, completed: false })),
          status: 'active',
          trainerComments: [],
          attachments: [],
          progress: 0,
          createdAt: new Date().toISOString()
        };
        await createPlanAssignment(newPlan, token);
        await addActivityLog(user?.email, 'Create Plan', `Created ${formData.type} plan "${formData.title}" for member ${selectedMember.name}`, token);
        alert('Plan created successfully!');
        resetForm();
      }
      await loadData();
    } catch (error) {
      console.error('Error saving plan:', error);
      setError('Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (planId) => {
    if (!planId) {
      console.error('No plan ID provided');
      alert('Cannot add comment: Plan ID missing');
      return;
    }
    
    const comment = commentText[planId];
    if (!comment || !comment.trim()) return;
    
    try {
      console.log('Adding comment to plan ID:', planId);
      await addTrainerComment(planId, comment, token);
      await loadData(); // Refresh to show new comment
      setCommentText({ ...commentText, [planId]: '' });
      alert('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleEdit = (plan) => {
    const planId = plan.id || plan._id;
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      type: plan.type,
      memberId: plan.memberId,
      dueDate: plan.dueDate || '',
      exercises: plan.exercises.map(ex => ({ name: ex.name, notes: ex.notes || '' }))
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (planId, title) => {
    if (window.confirm(`Delete plan "${title}"?`)) {
      try {
        await deletePlanAssignment(planId, token);
        await loadData();
        await addActivityLog(user?.email, 'Delete Plan', `Deleted plan ${title}`, token);
        alert('Plan deleted successfully.');
      } catch (error) {
        console.error('Error deleting plan:', error);
        alert('Failed to delete plan. Please try again.');
      }
    }
  };

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    error: { backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px' },
    button: { 
      padding: '8px 16px', 
      backgroundColor: '#1877f2', 
      color: 'white', 
      border: 'none', 
      borderRadius: '4px', 
      cursor: 'pointer', 
      marginBottom: '16px', 
      marginRight: '8px' 
    },
    cancelButton: { backgroundColor: '#6c757d' },
    saveButton: { backgroundColor: '#28a745' },
    deleteButton: { backgroundColor: '#dc3545', color: 'white' },
    editButton: { backgroundColor: '#ffc107', color: '#333' },
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
    textarea: { 
      display: 'block', 
      width: '100%', 
      padding: '8px', 
      marginBottom: '10px', 
      borderRadius: '4px', 
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`, 
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', 
      color: theme === 'dark' ? '#eee' : '#333' 
    },
    select: { 
      display: 'block', 
      width: '100%', 
      padding: '8px', 
      marginBottom: '10px', 
      borderRadius: '4px', 
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`, 
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', 
      color: theme === 'dark' ? '#eee' : '#333' 
    },
    planCard: { 
      padding: '16px', 
      marginBottom: '16px', 
      backgroundColor: 'var(--card-bg)', 
      borderRadius: '8px', 
      border: '1px solid var(--border-color)', 
      color: theme === 'dark' ? '#eee' : '#333' 
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
    commentInput: {
      width: '100%',
      padding: '8px',
      marginBottom: '8px',
      borderRadius: '4px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333',
      resize: 'vertical'
    },
    loadingText: { 
      textAlign: 'center', 
      padding: '40px', 
      color: 'var(--text-secondary)' 
    }
  };

  if (loading) {
    return <div style={styles.loadingText}>Loading plans and members...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Workout & Nutrition Plans</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Create custom workout or nutrition plans for your members.
      </p>
      
      {error && <div style={styles.error}>{error}</div>}
      
      <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={styles.button}>
        {showForm ? 'Cancel' : '+ Create New Plan'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input 
            name="title" 
            placeholder="Plan Title" 
            value={formData.title} 
            onChange={e => setFormData({ ...formData, title: e.target.value })} 
            required 
            style={styles.input} 
          />
          
          <select 
            value={formData.type} 
            onChange={e => setFormData({ ...formData, type: e.target.value })} 
            style={styles.select}
          >
            <option value="workout">💪 Workout Plan</option>
            <option value="nutrition">🥗 Nutrition Plan</option>
          </select>
          
          <input 
            type="date" 
            name="dueDate" 
            value={formData.dueDate} 
            onChange={e => setFormData({ ...formData, dueDate: e.target.value })} 
            style={styles.input} 
          />
          
          <select 
            value={formData.memberId} 
            onChange={(e) => setFormData({ ...formData, memberId: e.target.value })} 
            required 
            style={styles.select}
          >
            <option value="">-- Select a Member --</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.name || m.email}
              </option>
            ))}
          </select>
          
          <h4>Exercises / Items</h4>
          {formData.exercises.map((ex, idx) => (
            <div key={idx} style={{ marginBottom: '12px', border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`, padding: '8px', borderRadius: '4px' }}>
              <input 
                placeholder={formData.type === 'workout' ? "Exercise name" : "Meal / Food item"}
                value={ex.name} 
                onChange={e => handleExerciseChange(idx, 'name', e.target.value)} 
                required 
                style={styles.input} 
              />
              <textarea 
                placeholder={formData.type === 'workout' ? "Sets, reps, rest time" : "Portion size, ingredients"}
                value={ex.notes} 
                onChange={e => handleExerciseChange(idx, 'notes', e.target.value)} 
                rows="2" 
                style={styles.textarea} 
              />
              {formData.exercises.length > 1 && (
                <button type="button" onClick={() => handleRemoveExercise(idx)} style={{ ...styles.button, ...styles.deleteButton }}>
                  Remove
                </button>
              )}
            </div>
          ))}
          
          <button type="button" onClick={handleAddExercise} style={styles.button}>
            + Add Item
          </button>
          <button type="submit" style={{ ...styles.button, ...styles.saveButton }} disabled={saving}>
            {saving ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Create Plan')}
          </button>
        </form>
      )}

      {plans.length === 0 && !loading && (
        <p style={styles.loadingText}>No plans created yet. Click "Create New Plan" to get started.</p>
      )}
      
      {plans.map(plan => {
        // Use the correct ID - MongoDB uses _id
        const planId = plan._id || plan.id;
        
        return (
          <div key={planId} style={styles.planCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{plan.title}</h3>
              <span style={{ 
                fontSize: '12px', 
                padding: '2px 8px', 
                borderRadius: '4px',
                backgroundColor: plan.type === 'workout' ? '#4caf50' : '#ff9800',
                color: 'white'
              }}>
                {plan.type === 'workout' ? '💪 Workout' : '🥗 Nutrition'}
              </span>
            </div>
            <p><strong>Member:</strong> {plan.memberEmail}</p>
            <p><strong>Created:</strong> {new Date(plan.createdAt).toLocaleDateString()}</p>
            {plan.dueDate && <p><strong>Due:</strong> {new Date(plan.dueDate).toLocaleDateString()}</p>}
            <p><strong>Progress:</strong> {plan.progress || 0}%</p>

            <div style={{ marginBottom: '12px' }}>
              <button onClick={() => handleEdit(plan)} style={{ ...styles.button, ...styles.editButton }}>
                ✏️ Edit Plan
              </button>
              <button onClick={() => handleDelete(planId, plan.title)} style={{ ...styles.button, ...styles.deleteButton }}>
                🗑️ Delete Plan
              </button>
            </div>

            {/* Comments Section */}
            <div style={styles.commentSection}>
              <strong>💬 Comments & Feedback</strong>
              
              {/* Display existing comments */}
              {plan.trainerComments && plan.trainerComments.length > 0 ? (
                <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {plan.trainerComments.map((c, idx) => (
                    <div key={idx} style={styles.commentItem}>
                      <div style={styles.commentText}>
                        <strong>{c.trainerName}:</strong> {c.text}
                      </div>
                      <div style={styles.commentMeta}>
                        {new Date(c.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#888', fontSize: '12px', marginTop: '8px' }}>No comments yet.</p>
              )}
              
              {/* Add new comment */}
              <div style={{ marginTop: '12px' }}>
                <textarea
                  placeholder="Write a comment or feedback for the member..."
                  value={commentText[planId] || ''}
                  onChange={(e) => setCommentText({ ...commentText, [planId]: e.target.value })}
                  rows="2"
                  style={styles.commentInput}
                />
                <button
                  onClick={() => handleAddComment(planId)}
                  style={{ ...styles.button, backgroundColor: '#28a745', marginTop: '0' }}
                  disabled={!commentText[planId]?.trim()}
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TrainerPlans;