import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getTrainers, updateTrainer, deleteTrainer } from '../../services/trainerService';
import { getBranches } from '../../services/branchService';
import { addActivityLog } from '../../services/activityLogger';
import { useAuth } from '../../context/AuthContext';

function ManageTrainers() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [trainers, setTrainers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialty: '',
    bio: '',
    isActive: true,
    branchId: ''
  });

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trainersData, branchesData] = await Promise.all([
        getTrainers(token),
        getBranches()
      ]);
      setTrainers(trainersData);
      setBranches(branchesData.filter(b => b.isActive !== false));
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load trainers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.name || formData.name.trim() === '') {
      setError('Trainer name is required');
      return false;
    }
    if (!formData.email || formData.email.trim() === '') {
      setError('Email is required');
      return false;
    }
    if (!editingId && (!formData.password || formData.password.length < 6)) {
      setError('Password must be at least 6 characters for new trainers');
      return false;
    }
    if (!formData.branchId) {
      setError('Please select a branch');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      if (editingId) {
        // Update existing trainer
        const updateData = {
          name: formData.name.trim(),
          phone: formData.phone || '',
          specialty: formData.specialty || '',
          bio: formData.bio || '',
          branchId: formData.branchId,
          isActive: formData.isActive
        };
        
        // Only include password if provided
        if (formData.password && formData.password.length >= 6) {
          updateData.password = formData.password;
        }
        
        await updateTrainer(editingId, updateData, token);
        await addActivityLog(user?.email, 'Trainer Edit', `Updated trainer ${formData.name}`, token);
        setSuccess('Trainer updated successfully!');
      } else {
        // Create new trainer - use registration endpoint
        const registerData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone || '',
          role: 'trainer',
          branchId: formData.branchId,
          specialization: formData.specialty || '',
          experience: 0,
          isActive: true
        };
        
        // Call the registration endpoint to create user with hashed password
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(registerData)
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to create trainer');
        }
        
        await addActivityLog(user?.email, 'Trainer Create', `Created trainer ${formData.name} with email ${formData.email}`, token);
        setSuccess(`Trainer created successfully! They can log in with email: ${formData.email}`);
      }
      
      setTimeout(() => {
        resetForm();
        loadData();
        setSuccess('');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving trainer:', error);
      setError(error.message || 'Failed to save trainer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      specialty: '',
      bio: '',
      isActive: true,
      branchId: ''
    });
  };

  const handleEdit = (trainer) => {
    setEditingId(trainer.id || trainer._id);
    setFormData({
      name: trainer.name || '',
      email: trainer.email || '',
      password: '',
      phone: trainer.phone || '',
      specialty: trainer.specialty || trainer.specialization || '',
      bio: trainer.bio || '',
      isActive: trainer.isActive !== false,
      branchId: trainer.branchId || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (trainer) => {
    const trainerId = trainer.id || trainer._id;
    if (window.confirm(`Delete trainer "${trainer.name}"? This action cannot be undone.`)) {
      try {
        await deleteTrainer(trainerId, token);
        await addActivityLog(user?.email, 'Trainer Delete', `Deleted trainer ${trainer.name}`, token);
        setSuccess(`Trainer "${trainer.name}" deleted successfully!`);
        await loadData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting trainer:', error);
        setError('Failed to delete trainer. Please try again.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading trainers...</div>;
  }

  return (
    <div>
      <h2 style={styles.title}>Manage Trainers</h2>
      
      {error && <div style={styles.errorMessage}>{error}</div>}
      {success && <div style={styles.successMessage}>{success}</div>}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <h3>{editingId ? 'Edit Trainer' : 'Add New Trainer'}</h3>
        
        <input 
          name="name" 
          placeholder="Full Name *" 
          value={formData.name} 
          onChange={handleChange} 
          required 
          style={styles.input} 
        />
        
        <input 
          name="email" 
          type="email" 
          placeholder="Email *" 
          value={formData.email} 
          onChange={handleChange} 
          required 
          style={styles.input} 
        />
        
        {!editingId && (
          <input 
            name="password" 
            type="password" 
            placeholder="Password * (min 6 characters)" 
            value={formData.password} 
            onChange={handleChange} 
            required 
            style={styles.input} 
          />
        )}
        
        <input 
          name="phone" 
          placeholder="Phone Number" 
          value={formData.phone} 
          onChange={handleChange} 
          style={styles.input} 
        />
        
        <input 
          name="specialty" 
          placeholder="Specialty (e.g., Yoga, Cardio, Strength)" 
          value={formData.specialty} 
          onChange={handleChange} 
          style={styles.input} 
        />
        
        <textarea 
          name="bio" 
          placeholder="Bio (optional)" 
          value={formData.bio} 
          onChange={handleChange} 
          style={styles.textarea} 
          rows="3" 
        />
        
        <select 
          name="branchId" 
          value={formData.branchId} 
          onChange={handleChange} 
          required 
          style={styles.input}
        >
          <option value="">Select Branch *</option>
          {branches.map(b => (
            <option key={b.id || b._id} value={b.id || b._id}>{b.name}</option>
          ))}
        </select>
        
        <label style={styles.checkboxLabel}>
          <input 
            type="checkbox" 
            name="isActive" 
            checked={formData.isActive} 
            onChange={handleChange} 
          />
          Active (trainer can log in)
        </label>
        
        <div>
          <button type="submit" style={styles.saveButton} disabled={saving}>
            {saving ? 'Saving...' : (editingId ? 'Update Trainer' : 'Create Trainer')}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={styles.cancelButton}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3 style={styles.subtitle}>Existing Trainers ({trainers.length})</h3>
      <div style={styles.trainerList}>
        {trainers.length === 0 && (
          <p style={styles.emptyText}>No trainers found. Click "Create Trainer" to add one.</p>
        )}
        {trainers.map(trainer => {
          const trainerId = trainer.id || trainer._id;
          const branch = branches.find(b => (b.id || b._id) === trainer.branchId);
          return (
            <div key={trainerId} style={styles.trainerCard}>
              <h3>{trainer.name}</h3>
              <p><strong>Email:</strong> {trainer.email}</p>
              <p><strong>Phone:</strong> {trainer.phone || 'Not provided'}</p>
              <p><strong>Specialty:</strong> {trainer.specialty || trainer.specialization || 'General'}</p>
              {trainer.bio && <p><strong>Bio:</strong> {trainer.bio}</p>}
              <p><strong>Branch:</strong> {branch?.name || 'Unassigned'}</p>
              <p>Status: {trainer.isActive !== false ? '✅ Active' : '❌ Inactive'}</p>
              <button onClick={() => handleEdit(trainer)} style={styles.editButton}>Edit</button>
              <button onClick={() => handleDelete(trainer)} style={styles.deleteButton}>Delete</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  title: { color: 'var(--text-primary)', marginBottom: '20px' },
  subtitle: { color: 'var(--text-primary)', marginBottom: '15px', marginTop: '30px' },
  form: { marginBottom: '30px', padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '8px' },
  input: { display: 'block', width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`, backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', color: theme === 'dark' ? '#eee' : '#333' },
  textarea: { display: 'block', width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`, backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', color: theme === 'dark' ? '#eee' : '#333' },
  checkboxLabel: { display: 'block', marginBottom: '10px', color: theme === 'dark' ? '#eee' : '#333', cursor: 'pointer' },
  saveButton: { padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' },
  cancelButton: { padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  trainerList: { display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' },
  trainerCard: { padding: '16px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)', color: theme === 'dark' ? '#eee' : '#333' },
  editButton: { padding: '6px 12px', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' },
  deleteButton: { padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#aaa' : '#666' },
  emptyText: { textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#aaa' : '#666' },
  errorMessage: { backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px' },
  successMessage: { backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '15px' }
});

export default ManageTrainers;