import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadAPI } from '../services/api';
import { Container, Card, Button, Alert, Form } from 'react-bootstrap';

export default function ProfileUpload() {
  const { user, token, refreshUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError('');
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleUpload = async () => {
  if (!selectedFile) {
    setError('Please select a file first');
    return;
  }

  setUploading(true);
  setMessage('');
  setError('');

  const formData = new FormData();
  formData.append('profilePicture', selectedFile);

  try {
    const result = await uploadAPI.uploadProfilePicture(formData, token);
    if (result.success) {
      setMessage('Profile picture uploaded successfully!');
      
      // Wait a moment for the backend to update
      setTimeout(async () => {
        // Refresh user data from backend
        await refreshUser();
        setMessage('Profile picture updated! Refreshing...');
        
        // Force a page reload to update all components
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 500);
      
      setSelectedFile(null);
      document.getElementById('fileInput').value = '';
    }
  } catch (err) {
    setError(err.message || 'Upload failed');
  } finally {
    setUploading(false);
  }
};

  return (
    <Container className="mt-4">
      <Card>
        <Card.Body>
          <h3>Profile Picture</h3>
          
          {user?.profilePicture && (
            <div className="text-center mb-3">
              <img 
                src={user.profilePicture} 
                alt="Profile" 
                style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
          )}
          
          <Form.Group>
            <Form.Label>Upload New Profile Picture</Form.Label>
            <Form.Control 
              id="fileInput"
              type="file" 
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </Form.Group>
          
          {selectedFile && (
            <div className="mt-2">
              <p>Selected: {selectedFile.name}</p>
              <img 
                src={URL.createObjectURL(selectedFile)} 
                alt="Preview" 
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
              />
            </div>
          )}
          
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
          {message && <Alert variant="success" className="mt-3">{message}</Alert>}
          
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || uploading}
            className="mt-3"
          >
            {uploading ? 'Uploading...' : 'Upload to Cloudinary'}
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}