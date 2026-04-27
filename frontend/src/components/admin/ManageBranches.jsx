import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getBranches, saveBranch, updateBranch, deleteBranch } from '../../services/branchService';
import { addActivityLog } from '../../services/activityLogger';
import { useAuth } from '../../context/AuthContext';

function ManageBranches() {
  const { user, token } = useAuth(); // ADDED token
  const { theme } = useTheme();
  const [branches, setBranches] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    name: '', 
    address: '', 
    phone: '', 
    email: '', 
    isActive: true 
  });

  useEffect(() => {
    loadBranches();
  }, [token]);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const branchesData = await getBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading branches:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateBranch(editingId, formData, token);
        await addActivityLog(user?.email, 'Branch Edit', `Updated branch ${formData.name}`);
        alert('Branch updated successfully!');
      } else {
        const newBranch = { ...formData };
        await saveBranch(newBranch, token);
        await addActivityLog(user?.email, 'Branch Create', `Created branch ${formData.name}`);
        alert('Branch created successfully!');
      }
      await loadBranches();
      resetForm();
    } catch (error) {
      console.error('Error saving branch:', error);
      alert('Error saving branch. Please try again.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      address: '', 
      phone: '', 
      email: '', 
      isActive: true 
    });
  };

  const handleEdit = (branch) => {
    setEditingId(branch.id || branch._id);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      isActive: branch.isActive !== false
    });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete branch "${name}"? This will also affect users/classes assigned to it.`)) {
      try {
        await deleteBranch(id, token);
        await loadBranches();
        await addActivityLog(user?.email, 'Branch Delete', `Deleted branch ${name}`);
        alert('Branch deleted successfully.');
      } catch (error) {
        console.error('Error deleting branch:', error);
        alert('Error deleting branch. Please try again.');
      }
    }
  };

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    form: { marginBottom: '30px', padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '8px' },
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
    checkboxLabel: { 
      display: 'block', 
      marginBottom: '10px', 
      color: theme === 'dark' ? '#eee' : '#333' 
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
    branchList: { 
      display: 'grid', 
      gap: '16px', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' 
    },
    branchCard: { 
      padding: '16px', 
      backgroundColor: 'var(--card-bg)', 
      borderRadius: '8px', 
      border: '1px solid var(--border-color)', 
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
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading branches...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Manage Branches</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input 
          name="name" 
          placeholder="Branch Name" 
          value={formData.name} 
          onChange={handleChange} 
          required 
          style={styles.input} 
        />
        <input 
          name="address" 
          placeholder="Address" 
          value={formData.address} 
          onChange={handleChange} 
          required 
          style={styles.input} 
        />
        <input 
          name="phone" 
          placeholder="Phone" 
          value={formData.phone} 
          onChange={handleChange} 
          required 
          style={styles.input} 
        />
        <input 
          name="email" 
          type="email" 
          placeholder="Email" 
          value={formData.email} 
          onChange={handleChange} 
          required 
          style={styles.input} 
        />
        <label style={styles.checkboxLabel}>
          <input 
            type="checkbox" 
            name="isActive" 
            checked={formData.isActive} 
            onChange={handleChange} 
          />
          Active
        </label>
        <button type="submit" style={styles.saveButton}>
          {editingId ? 'Update' : 'Create'} Branch
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} style={styles.cancelButton}>
            Cancel
          </button>
        )}
      </form>

      <div style={styles.branchList}>
        {branches.map(branch => (
          <div key={branch.id || branch._id} style={styles.branchCard}>
            <h3>{branch.name}</h3>
            <p><strong>Address:</strong> {branch.address}</p>
            <p><strong>Phone:</strong> {branch.phone}</p>
            <p><strong>Email:</strong> {branch.email}</p>
            <p>Status: {branch.isActive !== false ? '✅ Active' : '❌ Inactive'}</p>
            <button onClick={() => handleEdit(branch)} style={styles.editButton}>Edit</button>
            <button onClick={() => handleDelete(branch.id || branch._id, branch.name)} style={styles.deleteButton}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageBranches;