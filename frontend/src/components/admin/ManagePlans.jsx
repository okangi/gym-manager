import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getPlans, savePlan, updatePlan, deletePlan } from '../../services/planService';
import { addActivityLog } from '../../services/activityLogger';
import { useAuth } from '../../context/AuthContext';
import { getCurrencySymbol } from '../../utils/currency';

function ManagePlans() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [plans, setPlans] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currency, setCurrency] = useState('$');
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    durationDays: 30, 
    duration: 'Monthly',
    features: '', 
    isActive: true 
  });

  // Load currency
  useEffect(() => {
    const loadCurrency = async () => {
      const symbol = await getCurrencySymbol();
      setCurrency(symbol);
    };
    loadCurrency();
    
    const handleSettingsUpdate = async () => {
      const symbol = await getCurrencySymbol();
      setCurrency(symbol);
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    loadPlans();
  }, [token]);

  const loadPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const plansData = await getPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading plans:', error);
      setError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Map durationDays to duration
    if (name === 'durationDays') {
      const durationMap = {
        '7': 'Weekly',
        '30': 'Monthly',
        '90': 'Quarterly',
        '365': 'Yearly'
      };
      setFormData(prev => ({ 
        ...prev, 
        [name]: parseInt(value),
        duration: durationMap[value] || 'Monthly'
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.name || !formData.price || !formData.durationDays) {
      setError('Please fill in all required fields');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    const featuresArray = formData.features.split(',').map(f => f.trim()).filter(f => f);
    
    // Map durationDays to duration enum value
    const durationMap = {
      7: 'Weekly',
      30: 'Monthly',
      90: 'Quarterly',
      365: 'Yearly'
    };
    
    try {
      const planData = {
        name: formData.name,
        price: Number(formData.price),
        durationDays: Number(formData.durationDays),
        duration: durationMap[formData.durationDays] || 'Monthly',
        features: featuresArray,
        isActive: formData.isActive
      };
      
      if (editingId) {
        await updatePlan(editingId, planData, token);
        // FIXED: Added token as 4th parameter
        if (token) {
          await addActivityLog(user?.email, 'Plan Edit', `Updated plan ${formData.name}`, token);
        }
        setSuccess('Plan updated successfully!');
      } else {
        await savePlan(planData, token);
        // FIXED: Added token as 4th parameter
        if (token) {
          await addActivityLog(user?.email, 'Plan Create', `Created plan ${formData.name}`, token);
        }
        setSuccess('Plan created successfully!');
      }
      
      setTimeout(() => {
        resetForm();
        loadPlans();
        window.dispatchEvent(new Event('plansUpdated'));
        setSuccess('');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving plan:', error);
      setError(error.message || 'Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      price: '', 
      durationDays: 30, 
      duration: 'Monthly',
      features: '', 
      isActive: true 
    });
    setError('');
    setSuccess('');
  };

  const handleEdit = (plan) => {
    setEditingId(plan.id || plan._id);
    setFormData({
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
      duration: plan.duration || 'Monthly',
      features: Array.isArray(plan.features) ? plan.features.join(', ') : '',
      isActive: plan.isActive !== false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete plan "${name}"? This action cannot be undone.`)) {
      try {
        await deletePlan(id, token);
        await loadPlans();
        window.dispatchEvent(new Event('plansUpdated'));
        // FIXED: Added token as 4th parameter
        if (token) {
          await addActivityLog(user?.email, 'Plan Delete', `Deleted plan ${name}`, token);
        }
        setSuccess(`Plan "${name}" deleted successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting plan:', error);
        setError('Failed to delete plan. Please try again.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading plans...</div>;
  }

  return (
    <div>
      <h2 style={styles.title}>Manage Membership Plans</h2>
      
      {error && <div style={styles.errorMessage}>{error}</div>}
      {success && <div style={styles.successMessage}>{success}</div>}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <h3>{editingId ? 'Edit Plan' : 'Create New Plan'}</h3>
        
        <input 
          name="name" 
          placeholder="Plan Name *" 
          value={formData.name} 
          onChange={handleChange} 
          required 
          style={styles.input} 
        />
        
        <input 
          name="price" 
          type="number" 
          step="0.01"
          placeholder={`Price (${currency}) *`} 
          value={formData.price} 
          onChange={handleChange} 
          required 
          style={styles.input} 
        />
        
        <select 
          name="durationDays" 
          value={formData.durationDays} 
          onChange={handleChange} 
          required 
          style={styles.input}
        >
          <option value="7">Weekly (7 days)</option>
          <option value="30">Monthly (30 days)</option>
          <option value="90">Quarterly (90 days)</option>
          <option value="365">Yearly (365 days)</option>
        </select>
        
        <textarea 
          name="features" 
          placeholder="Features (comma separated)" 
          value={formData.features} 
          onChange={handleChange} 
          style={styles.textarea} 
          rows="3" 
        />
        
        <label style={styles.checkboxLabel}>
          <input 
            type="checkbox" 
            name="isActive" 
            checked={formData.isActive} 
            onChange={handleChange} 
          />
          Active (plan visible to members)
        </label>
        
        <div>
          <button type="submit" style={styles.saveButton} disabled={saving}>
            {saving ? 'Saving...' : (editingId ? 'Update Plan' : 'Create Plan')}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={styles.cancelButton}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3 style={styles.subtitle}>Existing Plans ({plans.length})</h3>
      <div style={styles.planList}>
        {plans.length === 0 && (
          <p style={styles.emptyText}>No plans found. Click "Create Plan" to add one.</p>
        )}
        {plans.map(plan => (
          <div key={plan.id || plan._id} style={styles.planCard}>
            <h3>{plan.name} - {currency}{plan.price}</h3>
            <p><strong>Duration:</strong> {plan.duration || (plan.durationDays === 30 ? 'Monthly' : plan.durationDays + ' days')}</p>
            <p><strong>Features:</strong></p>
            <ul>
              {Array.isArray(plan.features) && plan.features.map((f, i) => <li key={i}>{f}</li>)}
              {(!plan.features || plan.features.length === 0) && <li>No features listed</li>}
            </ul>
            <p style={{ 
              color: plan.isActive !== false 
                ? (theme === 'dark' ? '#4caf50' : '#2e7d32') 
                : (theme === 'dark' ? '#f44336' : '#c62828') 
            }}>
              Status: {plan.isActive !== false ? '✅ Active' : '❌ Inactive'}
            </p>
            <button onClick={() => handleEdit(plan)} style={styles.editButton}>Edit</button>
            <button onClick={() => handleDelete(plan.id || plan._id, plan.name)} style={styles.deleteButton}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  title: { color: theme === 'dark' ? '#fff' : '#333', marginBottom: '20px' },
  subtitle: { color: theme === 'dark' ? '#ddd' : '#555', marginTop: '30px', marginBottom: '15px' },
  form: { marginBottom: '30px', padding: '20px', backgroundColor: theme === 'dark' ? '#0f3460' : '#f8f9fa', borderRadius: '8px' },
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
  checkboxLabel: {
    display: 'block',
    marginBottom: '10px',
    color: theme === 'dark' ? '#eee' : '#333',
    cursor: 'pointer'
  },
  saveButton: { 
    padding: '8px 16px', 
    backgroundColor: '#28a745', 
    color: 'white', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    marginRight: '8px' 
  },
  cancelButton: { 
    padding: '8px 16px', 
    backgroundColor: '#6c757d', 
    color: 'white', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer' 
  },
  planList: { 
    display: 'grid', 
    gap: '16px', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' 
  },
  planCard: {
    padding: '16px',
    backgroundColor: theme === 'dark' ? '#1e2a3a' : '#fff',
    borderRadius: '8px',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
    color: theme === 'dark' ? '#eee' : '#333'
  },
  editButton: { 
    padding: '6px 12px', 
    backgroundColor: '#ffc107', 
    color: '#333', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    marginRight: '8px' 
  },
  deleteButton: { 
    padding: '6px 12px', 
    backgroundColor: '#dc3545', 
    color: 'white', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer' 
  },
  loading: { 
    textAlign: 'center', 
    padding: '40px', 
    color: theme === 'dark' ? '#aaa' : '#666' 
  },
  emptyText: {
    textAlign: 'center',
    padding: '40px',
    color: theme === 'dark' ? '#aaa' : '#666'
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px'
  },
  successMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px'
  }
});

export default ManagePlans;