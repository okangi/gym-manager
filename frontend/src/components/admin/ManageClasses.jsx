import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getClasses, saveClass, updateClass, deleteClass } from '../../services/classService';
import { getTrainers } from '../../services/trainerService';
import { getBranches } from '../../services/branchService';
import { addActivityLog } from '../../services/activityLogger';
import { useAuth } from '../../context/AuthContext';

function ManageClasses() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ 
    name: '',
    description: '',
    instructorId: '',
    instructorName: '',
    branchId: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    maxCapacity: 20,
    price: 0,
    category: 'Yoga',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [classesData, trainersData, branchesData] = await Promise.all([
        getClasses(),
        getTrainers(token),
        getBranches()
      ]);
      
      setClasses(classesData);
      setTrainers(trainersData);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
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
    
    // Auto-update instructorName when instructorId changes
    if (name === 'instructorId') {
      const selectedTrainer = trainers.find(t => (t.id || t._id) === value);
      if (selectedTrainer) {
        setFormData(prev => ({ ...prev, instructorName: selectedTrainer.name }));
      }
    }
  };

  const validateForm = () => {
    if (!formData.name) {
      setError('Class name is required');
      return false;
    }
    if (!formData.instructorId) {
      setError('Please select an instructor');
      return false;
    }
    if (!formData.branchId) {
      setError('Please select a branch');
      return false;
    }
    if (!formData.startTime) {
      setError('Start time is required');
      return false;
    }
    if (!formData.endTime) {
      setError('End time is required');
      return false;
    }
    if (!formData.maxCapacity || formData.maxCapacity < 1) {
      setError('Capacity must be at least 1');
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
      const classData = {
        name: formData.name,
        description: formData.description || '',
        instructorId: formData.instructorId,
        instructorName: formData.instructorName,
        branchId: formData.branchId,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: parseInt(formData.duration),
        maxCapacity: parseInt(formData.maxCapacity),
        price: parseFloat(formData.price) || 0,
        category: formData.category,
        isActive: formData.isActive,
        currentEnrollment: 0,
        waitingList: []
      };
      
      if (editingId) {
        await updateClass(editingId, classData, token);
        await addActivityLog(user?.email, 'Class Edit', `Updated class ${formData.name}`, token);
        setSuccess('Class updated successfully!');
      } else {
        await saveClass(classData, token);
        await addActivityLog(user?.email, 'Class Create', `Created class ${formData.name}`, token);
        setSuccess('Class created successfully!');
      }
      
      setTimeout(() => {
        resetForm();
        loadData();
        setSuccess('');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving class:', error);
      setError(error.message || 'Failed to save class. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
      name: '',
      description: '',
      instructorId: '',
      instructorName: '',
      branchId: '',
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      maxCapacity: 20,
      price: 0,
      category: 'Yoga',
      isActive: true
    });
    setError('');
    setSuccess('');
  };

  const handleEdit = (cls) => {
    // Extract IDs from populated objects or use direct values
    const instructorId = cls.instructorId?._id || cls.instructorId;
    const branchId = cls.branchId?._id || cls.branchId;
    const instructorName = cls.instructorId?.name || cls.instructorName || '';
    
    setEditingId(cls.id || cls._id);
    setFormData({
      name: cls.name || '',
      description: cls.description || '',
      instructorId: instructorId || '',
      instructorName: instructorName,
      branchId: branchId || '',
      dayOfWeek: cls.dayOfWeek || 'Monday',
      startTime: cls.startTime || '09:00',
      endTime: cls.endTime || '10:00',
      duration: cls.duration || 60,
      maxCapacity: cls.maxCapacity || 20,
      price: cls.price || 0,
      category: cls.category || 'Yoga',
      isActive: cls.isActive !== false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete class "${name}"? This action cannot be undone.`)) {
      try {
        await deleteClass(id, token);
        await addActivityLog(user?.email, 'Class Delete', `Deleted class ${name}`, token);
        setSuccess(`Class "${name}" deleted successfully!`);
        await loadData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting class:', error);
        setError('Failed to delete class. Please try again.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  // Helper functions to display names from populated data
  const getTrainerName = (trainer) => {
    if (!trainer) return 'Unknown';
    // If trainer is an object with name property (populated)
    if (typeof trainer === 'object' && trainer.name) {
      return trainer.name;
    }
    // If trainer is an ID, find in trainers list
    const found = trainers.find(t => (t.id || t._id) === trainer);
    return found ? found.name : 'Unknown';
  };

  const getBranchName = (branch) => {
    if (!branch) return 'Unknown';
    // If branch is an object with name property (populated)
    if (typeof branch === 'object' && branch.name) {
      return branch.name;
    }
    // If branch is an ID, find in branches list
    const found = branches.find(b => (b.id || b._id) === branch);
    return found ? found.name : 'Unknown';
  };

  if (loading) {
    return <div style={styles.loading}>Loading classes...</div>;
  }

  return (
    <div>
      <h2 style={styles.title}>Manage Classes</h2>
      
      {error && <div style={styles.errorMessage}>{error}</div>}
      {success && <div style={styles.successMessage}>{success}</div>}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <h3>{editingId ? 'Edit Class' : 'Create New Class'}</h3>
        
        <input 
          name="name" 
          placeholder="Class Name *" 
          value={formData.name} 
          onChange={handleChange} 
          required 
          style={styles.input} 
        />
        
        <textarea 
          name="description" 
          placeholder="Description (optional)" 
          value={formData.description} 
          onChange={handleChange} 
          style={styles.textarea} 
          rows="2"
        />
        
        <select 
          name="category" 
          value={formData.category} 
          onChange={handleChange} 
          style={styles.input}
        >
          <option value="Yoga">Yoga</option>
          <option value="Cardio">Cardio</option>
          <option value="Strength">Strength</option>
          <option value="HIIT">HIIT</option>
          <option value="Dance">Dance</option>
          <option value="Boxing">Boxing</option>
        </select>
        
        <select 
          name="instructorId" 
          value={formData.instructorId} 
          onChange={handleChange} 
          required 
          style={styles.input}
        >
          <option value="">Select Instructor *</option>
          {trainers.map(t => (
            <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>
          ))}
        </select>
        
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
        
        <select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleChange} style={styles.input}>
          <option>Monday</option>
          <option>Tuesday</option>
          <option>Wednesday</option>
          <option>Thursday</option>
          <option>Friday</option>
          <option>Saturday</option>
          <option>Sunday</option>
        </select>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="time" 
            name="startTime" 
            value={formData.startTime} 
            onChange={handleChange} 
            required 
            style={{ ...styles.input, flex: 1 }} 
          />
          <input 
            type="time" 
            name="endTime" 
            value={formData.endTime} 
            onChange={handleChange} 
            required 
            style={{ ...styles.input, flex: 1 }} 
          />
        </div>
        
        <input 
          type="number" 
          name="duration" 
          placeholder="Duration (minutes)" 
          value={formData.duration} 
          onChange={handleChange} 
          style={styles.input} 
        />
        
        <input 
          type="number" 
          name="maxCapacity" 
          placeholder="Max Capacity *" 
          value={formData.maxCapacity} 
          onChange={handleChange} 
          required 
          style={styles.input} 
        />
        
        <input 
          type="number" 
          name="price" 
          placeholder="Price (KSH)" 
          value={formData.price} 
          onChange={handleChange} 
          style={styles.input} 
        />
        
        <label style={styles.checkboxLabel}>
          <input 
            type="checkbox" 
            name="isActive" 
            checked={formData.isActive} 
            onChange={handleChange} 
          />
          Active (class visible to members)
        </label>
        
        <div>
          <button type="submit" style={styles.saveButton} disabled={saving}>
            {saving ? 'Saving...' : (editingId ? 'Update Class' : 'Create Class')}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={styles.cancelButton}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3 style={styles.subtitle}>Existing Classes ({classes.length})</h3>
      <div style={styles.classList}>
        {classes.length === 0 && (
          <p style={styles.emptyText}>No classes found. Click "Create Class" to add one.</p>
        )}
        {classes.map(cls => (
          <div key={cls.id || cls._id} style={styles.classCard}>
            <h3>{cls.name}</h3>
            <p><strong>Instructor:</strong> {getTrainerName(cls.instructorId)}</p>
            <p><strong>Branch:</strong> {getBranchName(cls.branchId)}</p>
            <p><strong>Schedule:</strong> {cls.dayOfWeek} at {cls.startTime} - {cls.endTime}</p>
            <p><strong>Capacity:</strong> {cls.currentEnrollment || 0}/{cls.maxCapacity}</p>
            <p><strong>Price:</strong> KSH {cls.price || 0}</p>
            <p>Status: {cls.isActive !== false ? '✅ Active' : '❌ Inactive'}</p>
            <button onClick={() => handleEdit(cls)} style={styles.editButton}>Edit</button>
            <button onClick={() => handleDelete(cls.id || cls._id, cls.name)} style={styles.deleteButton}>Delete</button>
          </div>
        ))}
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
  classList: { display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' },
  classCard: { padding: '16px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)', color: theme === 'dark' ? '#eee' : '#333' },
  editButton: { padding: '6px 12px', backgroundColor: '#ffc107', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' },
  deleteButton: { padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#aaa' : '#666' },
  emptyText: { textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#aaa' : '#666' },
  errorMessage: { backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px' },
  successMessage: { backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '15px' }
});

export default ManageClasses;