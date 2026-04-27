import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getGymSettings, updateGymSettings } from '../../services/gymSettingsService';
import { addActivityLog } from '../../services/activityLogger';
import { useAuth } from '../../context/AuthContext';

function GymSettings() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [settings, setSettings] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // STYLES MUST BE DEFINED HERE - BEFORE ANY CONDITIONAL RETURNS
  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    form: { maxWidth: '600px', margin: '0 auto' },
    inputGroup: { marginBottom: '16px' },
    label: { display: 'block', marginBottom: '6px', fontWeight: 'bold', color: theme === 'dark' ? '#ddd' : '#555' },
    input: {
      width: '100%',
      padding: '8px',
      borderRadius: '4px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    textarea: {
      width: '100%',
      padding: '8px',
      borderRadius: '4px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333',
      minHeight: '80px'
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      width: '100%',
      fontSize: '16px'
    },
    messageDiv: { marginTop: '16px', padding: '10px', borderRadius: '4px', textAlign: 'center' },
    success: { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
    error: { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
      marginBottom: '12px'
    },
    logoPreview: {
      width: '100px',
      height: '100px',
      objectFit: 'contain',
      backgroundColor: '#f0f0f0',
      borderRadius: '8px',
      padding: '4px'
    },
    removeButton: {
      padding: '6px 12px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px'
    },
    fileInput: {
      display: 'block',
      marginTop: '8px',
      color: theme === 'dark' ? '#eee' : '#333',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      borderRadius: '4px',
      padding: '6px',
      width: '100%'
    },
    helperText: {
      fontSize: '12px',
      color: theme === 'dark' ? '#aaa' : '#666',
      marginTop: '4px'
    },
    loading: {
      textAlign: 'center',
      padding: '40px',
      color: theme === 'dark' ? '#aaa' : '#666'
    },
    uploadStatus: {
      fontSize: '12px',
      color: '#4caf50',
      marginTop: '4px'
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const gymSettings = await getGymSettings();
      setSettings(gymSettings);
      setLogoPreview(gymSettings.logo);
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('❌ Error loading settings');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  // Upload logo to Cloudinary (optional - if you want to store in Cloudinary instead of base64)
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'gym_manager');
    formData.append('cloud_name', 'dxmri3zzr');
    formData.append('folder', 'gym_logos');
    
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dxmri3zzr/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return null;
    }
  };

  const handleLogoUpload = async (e) => {
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
    
    setUploadingLogo(true);
    
    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
      setSettings(prev => ({ ...prev, logo: reader.result }));
    };
    reader.readAsDataURL(file);
    
    // Optional: Upload to Cloudinary instead of storing base64
    // const imageUrl = await uploadToCloudinary(file);
    // if (imageUrl) {
    //   setLogoPreview(imageUrl);
    //   setSettings(prev => ({ ...prev, logo: imageUrl }));
    // }
    
    setUploadingLogo(false);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setSettings(prev => ({ ...prev, logo: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setMessageType('');
    
    try {
      // Validate required fields
      if (!settings.name || settings.name.trim() === '') {
        setMessage('❌ Gym name is required');
        setMessageType('error');
        setSaving(false);
        return;
      }
      
      const result = await updateGymSettings(settings, token);
      if (result.success) {
        window.dispatchEvent(new Event('settingsUpdated'));
        await addActivityLog(user?.email, 'Gym Settings', 'Updated gym settings', token);
        setMessage('✅ Settings saved successfully!');
        setMessageType('success');
      } else {
        setMessage('❌ Error saving settings: ' + (result.error || 'Unknown error'));
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('❌ Error saving settings. Please try again.');
      setMessageType('error');
    } finally {
      setSaving(false);
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading settings...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>⚙️ Gym Settings</h2>
      
      {message && (
        <div style={{ ...styles.messageDiv, ...(messageType === 'success' ? styles.success : styles.error) }}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Gym Name *</label>
          <input 
            type="text" 
            name="name" 
            value={settings.name || ''} 
            onChange={handleChange} 
            style={styles.input} 
            required 
            placeholder="Enter gym name"
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Currency Symbol</label>
          <input
            type="text"
            name="currencySymbol"
            value={settings.currencySymbol || ''}
            onChange={handleChange}
            style={styles.input}
            placeholder="$"
            maxLength="4"
          />
          <div style={styles.helperText}>Symbol used for prices (e.g., $, KSh, €, £)</div>
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Gym Logo</label>
          <div style={styles.logoContainer}>
            {logoPreview && (
              <img src={logoPreview} alt="Logo Preview" style={styles.logoPreview} />
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleLogoUpload} 
              style={styles.fileInput} 
            />
            {logoPreview && (
              <button type="button" onClick={handleRemoveLogo} style={styles.removeButton}>
                Remove Logo
              </button>
            )}
          </div>
          {uploadingLogo && <p style={styles.uploadStatus}>⏳ Uploading logo...</p>}
          <div style={styles.helperText}>Upload a logo (PNG, JPG, max 2MB) – will appear in the navbar.</div>
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Location (short)</label>
          <input 
            type="text" 
            name="location" 
            value={settings.location || ''} 
            onChange={handleChange} 
            style={styles.input} 
            placeholder="e.g., Downtown, City Center"
          />
          <div style={styles.helperText}>Short location name displayed in the navbar</div>
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Full Address</label>
          <textarea 
            name="address" 
            value={settings.address || ''} 
            onChange={handleChange} 
            style={styles.textarea} 
            rows="3" 
            placeholder="Full street address"
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Phone Number</label>
          <input 
            type="tel" 
            name="phone" 
            value={settings.phone || ''} 
            onChange={handleChange} 
            style={styles.input} 
            placeholder="+1234567890"
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Email Address</label>
          <input 
            type="email" 
            name="email" 
            value={settings.email || ''} 
            onChange={handleChange} 
            style={styles.input} 
            placeholder="contact@gym.com"
          />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Opening Hours (Optional)</label>
          <input 
            type="text" 
            name="hours" 
            value={settings.hours || ''} 
            onChange={handleChange} 
            style={styles.input} 
            placeholder="Mon-Fri: 6am-10pm, Sat-Sun: 8am-8pm"
          />
          <div style={styles.helperText}>Displayed on landing page and contact section</div>
        </div>
        
        <button type="submit" style={styles.button} disabled={saving}>
          {saving ? '💾 Saving...' : '💾 Save Settings'}
        </button>
      </form>
      
      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>
        Changes will affect the entire application including navbar and landing page.
      </p>
    </div>
  );
}

export default GymSettings;