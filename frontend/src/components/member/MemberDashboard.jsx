import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Statistics from '../common/Statistics';
import ActivityLog from '../common/ActivityLog';
import { addActivityLog } from '../../services/activityLogger';
import { convertToCSV, downloadCSV } from '../../utils/csvExport';
import { updateUser } from '../../services/userService';
import { uploadAPI } from '../../services/api';

function MemberDashboard() {
  const { user, token, refreshUser } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  // Avatar state
  const [avatar, setAvatar] = useState(user?.profilePicture || null);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePicture || null);
  const [uploading, setUploading] = useState(false);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      });
      setAvatar(user.profilePicture || null);
      setAvatarPreview(user.profilePicture || null);
    }
  }, [user]);

  // Profile edit handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const updated = await updateUser(user.id || user._id, { name: formData.name }, token);
      await refreshUser();
      await addActivityLog(user.email, 'Profile Edit', 'Updated profile');
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  // Avatar handlers
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;
    
    setUploading(true);
    setMessage('');
    
    // Convert base64 to blob
    const response = await fetch(avatarPreview);
    const blob = await response.blob();
    const formData = new FormData();
    formData.append('profilePicture', blob, 'avatar.jpg');
    
    try {
      const result = await uploadAPI.uploadProfilePicture(formData, token);
      if (result.success) {
        await refreshUser();
        setAvatar(result.imageUrl);
        setShowAvatarUpload(false);
        await addActivityLog(user.email, 'Avatar Upload', 'Updated profile picture');
        setMessage('Avatar saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage('Error uploading avatar');
    } finally {
      setUploading(false);
    }
  };

  // Change password handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordMessage('');
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('❌ New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage('❌ New password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      // Call change password API (you may need to add this endpoint)
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setPasswordMessage('✅ Password changed successfully!');
        await addActivityLog(user.email, 'Password Change', 'Changed password');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setShowChangePassword(false), 1500);
      } else {
        setPasswordMessage('❌ ' + (data.message || 'Current password is incorrect'));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordMessage('❌ Error changing password');
    } finally {
      setLoading(false);
    }
  };

  // CSV export
  const handleExportActivity = () => {
    const allLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    const myLogs = allLogs.filter(log => log.userEmail === user.email);
    const columns = [
      { label: 'Action', key: 'action' },
      { label: 'Details', key: 'details' },
      { label: 'Timestamp', key: 'timestamp' }
    ];
    const csv = convertToCSV(myLogs, columns);
    downloadCSV(csv, `my_activity_${user.email}.csv`);
    addActivityLog(user.email, 'Export Data', 'Exported activity log');
    alert('Activity log exported!');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome, {user?.name || user?.email}!</h1>

        {message && <div style={styles.successMessage}>{message}</div>}

        {/* Statistics */}
        <Statistics currentUser={user} />

        {/* Activity Log */}
        <ActivityLog currentUser={user} />

        {/* Profile Section (View/Edit) */}
        {!isEditing ? (
          <div style={styles.userInfo}>
            {/* Avatar display */}
            <div style={styles.avatarContainer}>
              {avatar ? (
                <img src={avatar} alt="Avatar" style={styles.avatar} />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {user?.name ? user.name[0].toUpperCase() : '?'}
                </div>
              )}
              <button onClick={() => setShowAvatarUpload(!showAvatarUpload)} style={styles.avatarButton}>
                {avatar ? 'Change Avatar' : 'Upload Avatar'}
              </button>
            </div>
            {showAvatarUpload && (
              <div style={styles.avatarUploadContainer}>
                <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
                {avatarPreview && avatarPreview !== avatar && (
                  <button onClick={handleSaveAvatar} style={styles.saveButton} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Save Avatar'}
                  </button>
                )}
              </div>
            )}
            <p><strong>Name:</strong> {user?.name || user?.email}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Member since:</strong> {new Date(user?.createdAt).toLocaleDateString()}</p>
            <button onClick={() => setIsEditing(true)} style={styles.editButton} disabled={loading}>Edit Profile</button>
          </div>
        ) : (
          <div style={styles.userInfo}>
            <div style={styles.inputGroup}>
              <label>Name</label>
              <input name="name" value={formData.name} onChange={handleChange} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
              <label>Email</label>
              <input name="email" value={formData.email} onChange={handleChange} style={styles.input} disabled />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSave} style={styles.saveButton} disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setIsEditing(false)} style={styles.cancelButton}>Cancel</button>
            </div>
          </div>
        )}

        {/* Change Password Button */}
        <button onClick={() => setShowChangePassword(!showChangePassword)} style={styles.changePasswordButton}>
          🔒 Change Password
        </button>

        {showChangePassword && (
          <div style={styles.passwordSection}>
            <h4>Change Password</h4>
            {passwordMessage && <div style={styles.passwordMessage}>{passwordMessage}</div>}
            <input
              type="password"
              name="currentPassword"
              placeholder="Current Password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              style={styles.input}
            />
            <input
              type="password"
              name="newPassword"
              placeholder="New Password (min 6 characters)"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              style={styles.input}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm New Password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              style={styles.input}
            />
            <button onClick={handleUpdatePassword} style={styles.saveButton} disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}

        {/* Export Activity Button */}
        <button onClick={handleExportActivity} style={styles.exportButton}>
          📥 Export My Activity Log
        </button>
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: theme === 'dark' ? '#1a1a2e' : '#f0f2f5',
    padding: '20px'
  },
  card: {
    width: '90%',
    maxWidth: '800px',
    backgroundColor: theme === 'dark' ? '#16213e' : 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
    color: theme === 'dark' ? '#eee' : '#333',
  },
  title: { color: '#1877f2', marginBottom: '24px', textAlign: 'center' },
  userInfo: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: theme === 'dark' ? '#0f3460' : '#f8f9fa',
    borderRadius: '12px',
  },
  avatarContainer: { textAlign: 'center', marginBottom: '16px' },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #1877f2',
  },
  avatarPlaceholder: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#1877f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    fontSize: '40px',
    color: 'white',
  },
  avatarButton: {
    marginTop: '8px',
    padding: '6px 12px',
    backgroundColor: '#1877f2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  avatarUploadContainer: { textAlign: 'center', marginTop: '12px' },
  inputGroup: { marginBottom: '12px' },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
    backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
    color: theme === 'dark' ? '#eee' : '#333',
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: '#1877f2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '8px',
  },
  saveButton: {
    padding: '8px 16px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  changePasswordButton: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
  },
  exportButton: {
    marginTop: '12px',
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
  },
  passwordSection: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: theme === 'dark' ? '#0f3460' : '#f8f9fa',
    borderRadius: '8px',
  },
  passwordMessage: {
    marginBottom: '12px',
    padding: '8px',
    borderRadius: '4px',
    textAlign: 'center',
  },
  successMessage: {
    padding: '10px',
    backgroundColor: '#4caf50',
    color: 'white',
    borderRadius: '4px',
    textAlign: 'center',
    marginBottom: '16px',
  },
});

export default MemberDashboard;