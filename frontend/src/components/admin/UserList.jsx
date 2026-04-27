import { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { addActivityLog } from '../../services/activityLogger';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getBranches } from '../../services/branchService';
import { getUsers, updateUser, deleteUser } from '../../services/userService';

function UserList() {
  const { user: currentUser, token } = useAuth();
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newBranchId, setNewBranchId] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Bulk assignment states
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkBrancnhId, setBulkBranchId] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const loadUsers = async () => {
    try {
      const allUsers = await getUsers(token);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadBranches = async () => {
    try {
      const allBranches = await getBranches();
      const activeBranches = allBranches.filter(b => b.isActive);
      setBranches(activeBranches);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadUsers(), loadBranches()]);
      setLoading(false);
    };
    loadData();
  }, [token]);

  const filteredUsers = selectedBranch === 'all'
    ? users
    : users.filter(u => u.branchId === selectedBranch);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.email === currentUser?.email) {
      alert('You cannot delete your own account while logged in.');
      return;
    }
    if (window.confirm(`Delete user "${userToDelete.name || userToDelete.email}"?`)) {
      try {
        await deleteUser(userToDelete.id || userToDelete._id, token);
        await addActivityLog(currentUser?.email, 'Delete User', `Deleted user ${userToDelete.email}`, token);
        await loadUsers();
        // Clear selection after delete
        setSelectedUsers([]);
        setSelectAll(false);
        alert('User deleted successfully.');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const openBranchModal = (user) => {
    setSelectedUser(user);
    setNewBranchId(user.branchId || '');
    setShowBranchModal(true);
  };

  const confirmBranchChange = async () => {
    if (selectedUser && newBranchId) {
      try {
        await updateUser(selectedUser.id || selectedUser._id, { branchId: newBranchId }, token);
        await addActivityLog(currentUser?.email, 'Branch Change', `Changed branch of ${selectedUser.email} to ${newBranchId}`, token);
        await loadUsers();
        setShowBranchModal(false);
        alert('Branch updated successfully.');
      } catch (error) {
        console.error('Error updating branch:', error);
        alert('Error updating branch. Please try again.');
      }
    }
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
      setSelectAll(false);
    } else {
      const allUserIds = filteredUsers.map(user => user.id || user._id);
      setSelectedUsers(allUserIds);
      setSelectAll(true);
    }
  };

  // Handle individual user selection
  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
      setSelectAll(false);
    } else {
      setSelectedUsers([...selectedUsers, userId]);
      if (selectedUsers.length + 1 === filteredUsers.length) {
        setSelectAll(true);
      }
    }
  };

  // Handle bulk assignment
  const handleBulkAssign = async () => {
    if (!bulkBrancnhId || selectedUsers.length === 0) return;
    
    setAssigning(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const userId of selectedUsers) {
      try {
        await updateUser(userId, { branchId: bulkBrancnhId }, token);
        successCount++;
        await addActivityLog(
          currentUser?.email, 
          'Bulk Branch Assignment', 
          `Assigned user ${userId} to branch`,
          token
        );
      } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        failCount++;
      }
    }
    
    alert(`✅ Successfully assigned ${successCount} users to branch.\n❌ Failed: ${failCount}`);
    
    if (successCount > 0) {
      await loadUsers();
      setSelectedUsers([]);
      setSelectAll(false);
      setShowBulkAssignModal(false);
      setBulkBranchId('');
    }
    
    setAssigning(false);
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => (b.id || b._id) === branchId);
    return branch?.name || '—';
  };

  const styles = {
    container: {
      marginTop: '24px',
      padding: '16px',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '8px',
      overflowX: 'auto'
    },
    title: {
      marginTop: 0,
      marginBottom: '16px',
      color: theme === 'dark' ? '#fff' : '#1877f2'
    },
    filterBar: { display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' },
    filterLabel: { color: theme === 'dark' ? '#ddd' : '#555', fontWeight: '500' },
    select: {
      padding: '6px 12px',
      borderRadius: '4px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    bulkButton: {
      padding: '6px 12px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginLeft: 'auto',
      fontSize: '14px'
    },
    bulkButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '700px'
    },
    th: {
      textAlign: 'left',
      padding: '12px',
      backgroundColor: 'var(--card-bg)',
      color: theme === 'dark' ? '#eee' : '#333',
      borderBottom: `2px solid ${theme === 'dark' ? '#444' : '#dee2e6'}`
    },
    td: {
      padding: '10px',
      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#dee2e6'}`,
      color: theme === 'dark' ? '#ccc' : '#333'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    deleteButton: {
      padding: '4px 8px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginRight: '8px'
    },
    branchButton: {
      padding: '4px 8px',
      backgroundColor: '#ffc107',
      color: '#333',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginRight: '8px'
    },
    loading: {
      textAlign: 'center',
      padding: '40px',
      color: theme === 'dark' ? '#aaa' : '#666'
    },
    selectedCount: {
      marginLeft: '12px',
      fontSize: '12px',
      color: theme === 'dark' ? '#aaa' : '#666'
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading users...</div>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>👥 All Registered Users</h3>
      
      <div style={styles.filterBar}>
        <span style={styles.filterLabel}>Filter by branch:</span>
        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} style={styles.select}>
          <option value="all">All Branches</option>
          {branches.map((b, idx) => (
            <option key={b.id || b._id || `branch-${idx}`} value={b.id || b._id}>
              {b.name}
            </option>
          ))}
        </select>
        
        {selectedUsers.length > 0 && (
          <>
            <span style={styles.selectedCount}>{selectedUsers.length} user(s) selected</span>
            <button
              onClick={() => setShowBulkAssignModal(true)}
              style={styles.bulkButton}
            >
              📦 Bulk Assign ({selectedUsers.length})
            </button>
          </>
        )}
      </div>
      
      {filteredUsers.length === 0 ? (
        <p style={{ color: theme === 'dark' ? '#aaa' : '#666' }}>No users found for this branch.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>
                <input
                  type="checkbox"
                  checked={selectAll && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                  style={styles.checkbox}
                />
              </th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Branch</th>
              <th style={styles.th}>Login Count</th>
              <th style={styles.th}>Last Login</th>
              <th style={styles.th}>Joined</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => {
              const userId = user.id || user._id;
              return (
                <tr key={userId}>
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(userId)}
                      onChange={() => handleSelectUser(userId)}
                      style={styles.checkbox}
                    />
                  </td>
                  <td style={styles.td}>{user.name || '—'}</td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>{user.phone || '—'}</td>
                  <td style={styles.td}>{getBranchName(user.branchId)}</td>
                  <td style={styles.td}>{user.loginCount || 0}</td>
                  <td style={styles.td}>{formatDate(user.lastLogin)}</td>
                  <td style={styles.td}>{formatDate(user.createdAt)}</td>
                  <td style={styles.td}>
                    <span style={{
                      color: user.role === 'admin' ? '#ff9800' : user.role === 'trainer' ? '#4caf50' : '#1877f2',
                      fontWeight: 'bold'
                    }}>
                      {user.role || 'member'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {user.role !== 'admin' && (
                      <>
                        <button onClick={() => openBranchModal(user)} style={styles.branchButton}>Change Branch</button>
                        <button onClick={() => handleDeleteUser(user)} style={styles.deleteButton}>Delete</button>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <span style={{ color: '#999', fontSize: '12px' }}>Protected</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Single User Branch Change Modal */}
      <Modal show={showBranchModal} onHide={() => setShowBranchModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Change Branch for {selectedUser?.name || selectedUser?.email}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <select
            value={newBranchId}
            onChange={(e) => setNewBranchId(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">Select Branch</option>
            {branches.map((b, idx) => (
              <option key={b.id || b._id || `branch-${idx}`} value={b.id || b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBranchModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={confirmBranchChange}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Assignment Modal */}
      <Modal show={showBulkAssignModal} onHide={() => setShowBulkAssignModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>📦 Bulk Assign Branch</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You are about to assign <strong>{selectedUsers.length}</strong> user(s) to a branch.</p>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Branch:</label>
            <select
              value={bulkBrancnhId}
              onChange={(e) => setBulkBranchId(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">-- Select Branch --</option>
              {branches.map((b, idx) => (
                <option key={b.id || b._id || `branch-${idx}`} value={b.id || b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-muted" style={{ fontSize: '12px', color: '#666' }}>
            This action will update the branch for all selected users. This cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkAssignModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleBulkAssign} 
            disabled={!bulkBrancnhId || assigning}
          >
            {assigning ? 'Assigning...' : `Assign ${selectedUsers.length} User(s)`}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default UserList;