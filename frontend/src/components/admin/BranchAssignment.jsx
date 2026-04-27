import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUsers, updateUser } from '../../services/userService';
import { getBranches } from '../../services/branchService';
import { addActivityLog } from '../../services/activityLogger';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';

function BranchAssignment() {
  const { user: currentUser, token } = useAuth();
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bulkAction, setBulkAction] = useState(null);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, branchesData] = await Promise.all([
        getUsers(token),
        getBranches()
      ]);
      setUsers(usersData);
      setFilteredUsers(usersData);
      setBranches(branchesData.filter(b => b.isActive !== false));
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...users];
    
    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.phone?.includes(term)
      );
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id || u._id));
    }
  };

  const handleAssignBranch = async () => {
    if (!selectedBranch) {
      setError('Please select a branch');
      return;
    }
    
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }
    
    setUpdating(true);
    setError('');
    setMessage('');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const userId of selectedUsers) {
      try {
        await updateUser(userId, { branchId: selectedBranch }, token);
        successCount++;
        await addActivityLog(
          currentUser?.email, 
          'Branch Assignment', 
          `Assigned user ${userId} to branch ${selectedBranch}`,
          token
        );
      } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        failCount++;
      }
    }
    
    if (successCount > 0) {
      setMessage(`✅ Successfully assigned ${successCount} user(s) to branch.`);
      if (failCount > 0) {
        setError(`⚠️ Failed to assign ${failCount} user(s).`);
      }
      await loadData();
      setSelectedUsers([]);
      setSelectedBranch('');
    } else {
      setError('Failed to assign users. Please try again.');
    }
    
    setUpdating(false);
    setShowConfirmModal(false);
    setTimeout(() => {
      setMessage('');
      setError('');
    }, 5000);
  };

  const openBulkAction = (action) => {
    setBulkAction(action);
    setShowConfirmModal(true);
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => (b.id || b._id) === branchId);
    return branch?.name || 'Unassigned';
  };

  const styles = {
    container: {
      padding: '20px',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '8px'
    },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    filters: {
      display: 'flex',
      gap: '12px',
      marginBottom: '20px',
      flexWrap: 'wrap',
      alignItems: 'center'
    },
    filterInput: {
      padding: '8px',
      borderRadius: '4px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333',
      minWidth: '200px'
    },
    select: {
      padding: '8px',
      borderRadius: '4px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    assignArea: {
      marginBottom: '20px',
      padding: '16px',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#f8f9fa',
      borderRadius: '8px',
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    assignButton: {
      padding: '8px 20px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold'
    },
    tableWrapper: {
      overflowX: 'auto'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: '10px',
      backgroundColor: theme === 'dark' ? '#0f3460' : '#e9ecef',
      color: theme === 'dark' ? '#eee' : '#333',
      borderBottom: `2px solid ${theme === 'dark' ? '#444' : '#dee2e6'}`
    },
    td: {
      padding: '8px',
      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
      color: theme === 'dark' ? '#ccc' : '#333'
    },
    checkbox: {
      width: '20px',
      height: '20px',
      cursor: 'pointer'
    },
    branchBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold',
      backgroundColor: '#1877f2',
      color: 'white'
    },
    unassignedBadge: {
      backgroundColor: '#6c757d',
      color: 'white'
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '40px',
      color: 'var(--text-secondary)'
    },
    successMessage: {
      padding: '10px',
      marginBottom: '16px',
      backgroundColor: '#d4edda',
      color: '#155724',
      borderRadius: '4px'
    },
    errorMessage: {
      padding: '10px',
      marginBottom: '16px',
      backgroundColor: '#f8d7da',
      color: '#721c24',
      borderRadius: '4px'
    },
    stats: {
      marginTop: '16px',
      padding: '8px',
      fontSize: '12px',
      color: 'var(--text-secondary)',
      textAlign: 'center'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>🏢 Branch Assignment</h2>
        <div style={styles.loadingContainer}>
          <Spinner animation="border" variant="primary" />
          <p>Loading users and branches...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🏢 Branch Assignment</h2>
      
      {message && <div style={styles.successMessage}>{message}</div>}
      {error && <div style={styles.errorMessage}>{error}</div>}
      
      <div style={styles.assignArea}>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          style={styles.select}
        >
          <option value="">Select Branch to Assign</option>
          {branches.map(branch => (
            <option key={branch.id || branch._id} value={branch.id || branch._id}>
              {branch.name}
            </option>
          ))}
        </select>
        
        <span style={{ color: 'var(--text-secondary)' }}>
          {selectedUsers.length} user(s) selected
        </span>
        
        <button
          onClick={() => openBulkAction('assign')}
          style={styles.assignButton}
          disabled={!selectedBranch || selectedUsers.length === 0 || updating}
        >
          {updating ? 'Assigning...' : `Assign to Branch`}
        </button>
        
        <button
          onClick={handleSelectAll}
          style={{ ...styles.assignButton, backgroundColor: '#6c757d' }}
        >
          {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.filterInput}
        />
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={styles.select}
        >
          <option value="all">All Roles</option>
          <option value="member">Members</option>
          <option value="trainer">Trainers</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      
      <div style={styles.tableWrapper}>
        <table className="responsive-table" style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                  style={styles.checkbox}
                />
              </th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Current Branch</th>
              <th style={styles.th}>Phone</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => {
              const userId = user.id || user._id;
              const isSelected = selectedUsers.includes(userId);
              const branchName = getBranchName(user.branchId);
              
              return (
                <tr key={userId}>
                  <td data-label="Select" style={styles.td}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectUser(userId)}
                      style={styles.checkbox}
                    />
                  </td>
                  <td data-label="Name" style={styles.td}>
                    <strong>{user.name || 'N/A'}</strong>
                  </td>
                  <td data-label="Email" style={styles.td}>{user.email}</td>
                  <td data-label="Role" style={styles.td}>
                    <span style={{
                      color: user.role === 'admin' ? '#ff9800' : user.role === 'trainer' ? '#4caf50' : '#1877f2'
                    }}>
                      {user.role || 'member'}
                    </span>
                  </td>
                  <td data-label="Current Branch" style={styles.td}>
                    <span style={{
                      ...styles.branchBadge,
                      ...(!user.branchId && styles.unassignedBadge)
                    }}>
                      {branchName}
                    </span>
                  </td>
                  <td data-label="Phone" style={styles.td}>{user.phone || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredUsers.length === 0 && (
        <div style={styles.loadingContainer}>No users found matching your filters.</div>
      )}
      
      <div style={styles.stats}>
        Showing {filteredUsers.length} of {users.length} users | 
        {branches.length} branches available
      </div>
      
      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Bulk Action</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to assign <strong>{selectedUsers.length} users</strong> to branch <strong>{getBranchName(selectedBranch)}</strong>?</p>
          <p className="text-muted">This action will update the branch for all selected users.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAssignBranch}>
            Confirm Assignment
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default BranchAssignment;