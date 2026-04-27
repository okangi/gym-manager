import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { uploadAPI } from '../../services/api';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';

function TrainerProfile() {
  const { user, token, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    experience: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      // Handle specialization - could be array or string
      let specializationValue = '';
      if (user.specialization) {
        if (Array.isArray(user.specialization)) {
          specializationValue = user.specialization.join(', ');
        } else {
          specializationValue = user.specialization;
        }
      }
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        specialization: specializationValue,
        experience: user.experience || ''
      });
    }
  }, [user]);

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

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    
    try {
      // Prepare update data
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        specialization: formData.specialization ? formData.specialization.split(',').map(s => s.trim()) : [],
        experience: formData.experience ? parseInt(formData.experience) : 0
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
        await refreshUser();
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    },
    input: {
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`
    },
    label: { color: 'var(--text-primary)' }
  };

  return (
    <Container className="mt-4" style={styles.container}>
      <h2 className="mb-4" style={{ color: 'var(--text-primary)' }}>Trainer Profile</h2>
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
                    {user?.name?.charAt(0) || 'T'}
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
              <h5 className="mb-3">Trainer Information</h5>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label style={styles.label}>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label style={styles.label}>Email</Form.Label>
                  <Form.Control 
                    type="email" 
                    value={formData.email} 
                    disabled 
                    style={styles.input}
                  />
                  <Form.Text className="text-muted">
                    Email cannot be changed. Contact support for assistance.
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label style={styles.label}>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label style={styles.label}>Specialization</Form.Label>
                  <Form.Control
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="Yoga, Pilates, Cardio, Strength Training, etc."
                    style={styles.input}
                  />
                  <Form.Text className="text-muted">
                    Separate multiple specializations with commas
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label style={styles.label}>Years of Experience</Form.Label>
                  <Form.Control
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="Number of years"
                    min="0"
                    max="50"
                    style={styles.input}
                  />
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  onClick={handleSave}
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

export default TrainerProfile;