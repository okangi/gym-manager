import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { uploadAPI } from '../../services/api';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';

function ProfileSettings() {
  const { user, token, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      const result = await uploadAPI.uploadProfilePicture(formData, token);
      if (result.success) {
        setMessage('Profile picture updated successfully!');
        await refreshUser();
        
        setTimeout(() => {
          setPreviewUrl(null);
          setSelectedFile(null);
          setMessage('');
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      // Update profile information using the correct endpoint
      const updateData = {
        name: formData.name,
        phone: formData.phone
      };

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Profile updated successfully!');
        await refreshUser(); // This will update the user context and localStorage
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to update profile');
      }

      // Change password if provided
      if (formData.currentPassword && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('New passwords do not match');
          return;
        }

        if (formData.newPassword.length < 6) {
          setError('New password must be at least 6 characters');
          return;
        }

        const passwordResponse = await fetch('http://localhost:5000/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword
          })
        });

        const passwordData = await passwordResponse.json();

        if (passwordData.success) {
          setMessage('Profile and password updated successfully!');
          // Clear password fields
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
        } else {
          setError(passwordData.message || 'Failed to change password');
        }
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const styles = {
    container: { backgroundColor: 'var(--bg-primary)', minHeight: '100vh' },
    card: { backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' },
    avatar: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '3px solid #1877f2'
    },
    defaultAvatar: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      backgroundColor: '#1877f2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto',
      fontSize: '60px',
      color: 'white'
    }
  };

  return (
    <Container className="mt-4" style={styles.container}>
      <Row>
        <Col md={4}>
          <Card className="mb-4" style={styles.card}>
            <Card.Body className="text-center">
              <h5 className="mb-3">Profile Picture</h5>
              
              {/* Current Profile Picture */}
              {user?.profilePicture && !previewUrl && (
                <div className="mb-3">
                  <img 
                    src={user.profilePicture} 
                    alt="Profile" 
                    style={styles.avatar}
                  />
                </div>
              )}
              
              {/* Preview */}
              {previewUrl && (
                <div className="mb-3">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ ...styles.avatar, border: '3px solid #4caf50' }}
                  />
                  <p className="text-success small mt-2">Preview - Click upload to save</p>
                </div>
              )}
              
              {/* Default Avatar */}
              {!user?.profilePicture && !previewUrl && (
                <div className="mb-3">
                  <div style={styles.defaultAvatar}>
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                </div>
              )}
              
              <Form.Group className="mb-3">
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  size="sm"
                />
              </Form.Group>
              
              {selectedFile && (
                <Button 
                  onClick={handleUpload} 
                  disabled={uploading}
                  variant="primary"
                  size="sm"
                  className="w-100"
                >
                  {uploading ? 'Uploading...' : 'Save Photo'}
                </Button>
              )}
              
              {error && <Alert variant="danger" className="mt-3 small">{error}</Alert>}
              {message && <Alert variant="success" className="mt-3 small">{message}</Alert>}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card style={styles.card}>
            <Card.Body>
              <h5 className="mb-3">Profile Information</h5>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    style={{ backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', color: theme === 'dark' ? '#eee' : '#333' }}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    disabled
                    style={{ backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', color: theme === 'dark' ? '#eee' : '#333' }}
                  />
                  <Form.Text className="text-muted">
                    Email cannot be changed. Contact support for assistance.
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    style={{ backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', color: theme === 'dark' ? '#eee' : '#333' }}
                  />
                </Form.Group>
                
                <hr />
                <h6 className="mb-3">Change Password</h6>
                
                <Form.Group className="mb-3">
                  <Form.Label>Current Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Enter current password"
                    style={{ backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', color: theme === 'dark' ? '#eee' : '#333' }}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password (min 6 characters)"
                    style={{ backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', color: theme === 'dark' ? '#eee' : '#333' }}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                    style={{ backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', color: theme === 'dark' ? '#eee' : '#333' }}
                  />
                </Form.Group>
                
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ProfileSettings;