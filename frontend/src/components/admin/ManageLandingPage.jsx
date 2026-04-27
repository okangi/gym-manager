import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getLandingContent, updateLandingContent } from '../../services/landingService';
import { addActivityLog } from '../../services/activityLogger';
import { useAuth } from '../../context/AuthContext';

function ManageLandingPage() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [content, setContent] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const [uploadingImages, setUploadingImages] = useState({});

  // Upload image to Cloudinary
  const uploadToCloudinary = async (file, folder = 'landing') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'gym_manager');
    formData.append('cloud_name', 'dxmri3zzr');
    formData.append('folder', folder);
    
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dxmri3zzr/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!data.secure_url) {
        throw new Error('Upload failed');
      }
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      setMessage('Failed to upload image to Cloudinary. Please check your Cloudinary credentials.');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
      return null;
    }
  };

  // Extract YouTube thumbnail from any YouTube URL format
  const getYouTubeThumbnail = (url) => {
    if (!url) return '';
    
    let videoId = '';
    
    // Pattern 1: youtube.com/watch?v=...
    let match = url.match(/[?&]v=([^&]+)/);
    if (match) videoId = match[1];
    
    // Pattern 2: youtu.be/...
    if (!videoId) {
      match = url.match(/youtu\.be\/([^?&]+)/);
      if (match) videoId = match[1];
    }
    
    // Pattern 3: youtube.com/embed/...
    if (!videoId) {
      match = url.match(/\/embed\/([^?&]+)/);
      if (match) videoId = match[1];
    }
    
    // Pattern 4: youtube.com/shorts/...
    if (!videoId) {
      match = url.match(/\/shorts\/([^?&]+)/);
      if (match) videoId = match[1];
    }
    
    if (videoId) {
      videoId = videoId.split('?')[0];
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    
    return '';
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const styles = {
    container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
    title: { color: theme === 'dark' ? '#fff' : '#333', marginBottom: '20px' },
    tabBar: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`, paddingBottom: '10px' },
    tab: { padding: '10px 20px', cursor: 'pointer', borderRadius: '8px 8px 0 0', backgroundColor: theme === 'dark' ? '#1e2a3a' : '#f8f9fa', color: theme === 'dark' ? '#eee' : '#333', border: 'none', transition: 'all 0.2s' },
    activeTab: { backgroundColor: '#1877f2', color: 'white' },
    section: { 
      marginBottom: '30px', 
      padding: '20px', 
      backgroundColor: theme === 'dark' ? '#0f3460' : '#f8f9fa', 
      borderRadius: '8px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`
    },
    input: { 
      width: '100%', 
      padding: '8px', 
      marginBottom: '10px', 
      borderRadius: '4px', 
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`, 
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', 
      color: theme === 'dark' ? '#eee' : '#333' 
    },
    textarea: { 
      width: '100%', 
      padding: '8px', 
      marginBottom: '10px', 
      borderRadius: '4px', 
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`, 
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', 
      color: theme === 'dark' ? '#eee' : '#333', 
      minHeight: '100px' 
    },
    button: { 
      padding: '8px 16px', 
      backgroundColor: '#1877f2', 
      color: 'white', 
      border: 'none', 
      borderRadius: '4px', 
      cursor: 'pointer', 
      marginRight: '8px',
      marginTop: '8px'
    },
    deleteButton: { backgroundColor: '#dc3545' },
    messageDiv: { marginTop: '16px', padding: '10px', borderRadius: '4px', textAlign: 'center' },
    success: { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
    error: { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
    loading: { textAlign: 'center', padding: '40px', color: theme === 'dark' ? '#aaa' : '#666' },
    saveButton: { 
      padding: '12px 24px', 
      backgroundColor: '#28a745', 
      color: 'white', 
      border: 'none', 
      borderRadius: '4px', 
      cursor: 'pointer', 
      fontSize: '16px',
      marginTop: '20px',
      width: '100%'
    },
    imagePreview: { maxWidth: '100%', maxHeight: '150px', marginTop: '8px', borderRadius: '4px', objectFit: 'cover' },
    thumbnail: { width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', marginRight: '8px' },
    itemCard: { 
      border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`, 
      padding: '12px', 
      marginBottom: '12px', 
      borderRadius: '4px',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#fff'
    },
    uploadStatus: { fontSize: '12px', color: '#4caf50', marginTop: '4px' }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const data = await getLandingContent();
      if (data && data.hero) {
        setContent(data);
      } else {
        // Set default content if none exists
        setContent({
          hero: { title: 'Welcome to Our Gym', subtitle: 'Transform Your Life', buttonText: 'Join Now', buttonLink: '/register', backgroundImage: '' },
          aboutText: 'We are dedicated to helping you achieve your fitness goals.',
          features: [],
          gallery: [],
          trainingVideos: [],
          socialLinks: { facebook: '', instagram: '', twitter: '', youtube: '' },
          testimonials: []
        });
      }
    } catch (error) {
      console.error('Error loading landing content:', error);
      showMessage('❌ Error loading content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHeroChange = (e) => {
    const { name, value } = e.target;
    setContent(prev => ({ ...prev, hero: { ...prev.hero, [name]: value } }));
  };

  const handleHeroImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingImages(prev => ({ ...prev, hero: true }));
    
    // Show preview temporarily
    const reader = new FileReader();
    reader.onloadend = () => {
      setContent(prev => ({ ...prev, hero: { ...prev.hero, backgroundImage: reader.result } }));
    };
    reader.readAsDataURL(file);
    
    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(file, 'hero');
    if (imageUrl) {
      setContent(prev => ({ ...prev, hero: { ...prev.hero, backgroundImage: imageUrl } }));
    }
    
    setUploadingImages(prev => ({ ...prev, hero: false }));
  };

  const handleAboutChange = (e) => setContent(prev => ({ ...prev, aboutText: e.target.value }));

  const addFeature = () => {
    const newId = Date.now().toString();
    setContent(prev => ({ 
      ...prev, 
      features: [...(prev.features || []), { id: newId, icon: '🏋️', title: 'New Feature', description: 'Description' }] 
    }));
  };

  const updateFeature = (id, field, value) => {
    setContent(prev => ({ 
      ...prev, 
      features: (prev.features || []).map(f => f.id === id ? { ...f, [field]: value } : f) 
    }));
  };

  const removeFeature = (id) => {
    setContent(prev => ({ 
      ...prev, 
      features: (prev.features || []).filter(f => f.id !== id) 
    }));
  };

  const addGalleryItem = () => {
    const newId = Date.now().toString();
    setContent(prev => ({ 
      ...prev, 
      gallery: [...(prev.gallery || []), { id: newId, image: '', caption: '' }] 
    }));
  };

  const updateGalleryItem = (id, field, value) => {
    setContent(prev => ({ 
      ...prev, 
      gallery: (prev.gallery || []).map(g => g.id === id ? { ...g, [field]: value } : g) 
    }));
  };

  const removeGalleryItem = (id) => {
    setContent(prev => ({ 
      ...prev, 
      gallery: (prev.gallery || []).filter(g => g.id !== id) 
    }));
  };

  const handleGalleryImage = async (id, file) => {
    if (!file) return;
    
    setUploadingImages(prev => ({ ...prev, [id]: true }));
    
    // Show preview temporarily
    const reader = new FileReader();
    reader.onloadend = () => {
      updateGalleryItem(id, 'image', reader.result);
    };
    reader.readAsDataURL(file);
    
    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(file, 'gallery');
    if (imageUrl) {
      updateGalleryItem(id, 'image', imageUrl);
    }
    
    setUploadingImages(prev => ({ ...prev, [id]: false }));
  };

  const addVideo = () => {
    const newId = Date.now().toString();
    setContent(prev => ({ 
      ...prev, 
      trainingVideos: [...(prev.trainingVideos || []), { id: newId, url: '', title: '' }] 
    }));
  };

  const updateVideo = (id, field, value) => {
    setContent(prev => ({ 
      ...prev, 
      trainingVideos: (prev.trainingVideos || []).map(v => v.id === id ? { ...v, [field]: value } : v) 
    }));
    
    // Auto-generate thumbnail when URL is updated
    if (field === 'url' && value && (value.includes('youtube') || value.includes('youtu.be'))) {
      const thumbnail = getYouTubeThumbnail(value);
      if (thumbnail) {
        setContent(prev => ({ 
          ...prev, 
          trainingVideos: (prev.trainingVideos || []).map(v => v.id === id ? { ...v, thumbnail } : v) 
        }));
      }
    }
  };

  const removeVideo = (id) => {
    setContent(prev => ({ 
      ...prev, 
      trainingVideos: (prev.trainingVideos || []).filter(v => v.id !== id) 
    }));
  };

  const handleSocialChange = (platform, value) => {
    setContent(prev => ({ 
      ...prev, 
      socialLinks: { ...prev.socialLinks, [platform]: value } 
    }));
  };

  const addTestimonial = () => {
    const newId = Date.now().toString();
    setContent(prev => ({ 
      ...prev, 
      testimonials: [...(prev.testimonials || []), { id: newId, name: '', role: '', text: '', avatar: '' }] 
    }));
  };

  const updateTestimonial = (id, field, value) => {
    setContent(prev => ({ 
      ...prev, 
      testimonials: (prev.testimonials || []).map(t => t.id === id ? { ...t, [field]: value } : t) 
    }));
  };

  const removeTestimonial = (id) => {
    setContent(prev => ({ 
      ...prev, 
      testimonials: (prev.testimonials || []).filter(t => t.id !== id) 
    }));
  };

  const handleTestimonialAvatar = async (id, file) => {
    if (!file) return;
    
    setUploadingImages(prev => ({ ...prev, [`avatar-${id}`]: true }));
    
    // Show preview temporarily
    const reader = new FileReader();
    reader.onloadend = () => {
      updateTestimonial(id, 'avatar', reader.result);
    };
    reader.readAsDataURL(file);
    
    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(file, 'testimonials');
    if (imageUrl) {
      updateTestimonial(id, 'avatar', imageUrl);
    }
    
    setUploadingImages(prev => ({ ...prev, [`avatar-${id}`]: false }));
  };

  const saveChanges = async () => {
    setSaving(true);
    setMessage('');
    try {
      const result = await updateLandingContent(content, token);
      if (result.success) {
        await addActivityLog(user?.email, 'Landing Page', 'Updated landing page content', token);
        showMessage('✅ Landing page updated successfully!', 'success');
      } else {
        showMessage('❌ Error updating landing page: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error saving:', error);
      showMessage('❌ Error saving changes. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading landing page content...</div>;
  if (!content) return <div style={styles.loading}>No content available</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎨 Manage Landing Page</h2>
      
      {message && (
        <div style={{ ...styles.messageDiv, ...(messageType === 'success' ? styles.success : styles.error) }}>
          {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={styles.tabBar}>
        <button onClick={() => setActiveTab('hero')} style={{ ...styles.tab, ...(activeTab === 'hero' ? styles.activeTab : {}) }}>🏠 Hero</button>
        <button onClick={() => setActiveTab('about')} style={{ ...styles.tab, ...(activeTab === 'about' ? styles.activeTab : {}) }}>📝 About</button>
        <button onClick={() => setActiveTab('features')} style={{ ...styles.tab, ...(activeTab === 'features' ? styles.activeTab : {}) }}>✨ Features</button>
        <button onClick={() => setActiveTab('gallery')} style={{ ...styles.tab, ...(activeTab === 'gallery' ? styles.activeTab : {}) }}>🖼️ Gallery</button>
        <button onClick={() => setActiveTab('videos')} style={{ ...styles.tab, ...(activeTab === 'videos' ? styles.activeTab : {}) }}>🎥 Videos</button>
        <button onClick={() => setActiveTab('social')} style={{ ...styles.tab, ...(activeTab === 'social' ? styles.activeTab : {}) }}>📱 Social</button>
        <button onClick={() => setActiveTab('testimonials')} style={{ ...styles.tab, ...(activeTab === 'testimonials' ? styles.activeTab : {}) }}>⭐ Testimonials</button>
      </div>

      {/* Hero Section */}
      {activeTab === 'hero' && (
        <div style={styles.section}>
          <h3>Hero Section</h3>
          <input name="title" placeholder="Title" value={content.hero?.title || ''} onChange={handleHeroChange} style={styles.input} />
          <input name="subtitle" placeholder="Subtitle" value={content.hero?.subtitle || ''} onChange={handleHeroChange} style={styles.input} />
          <input name="buttonText" placeholder="Button Text" value={content.hero?.buttonText || ''} onChange={handleHeroChange} style={styles.input} />
          <input name="buttonLink" placeholder="Button Link" value={content.hero?.buttonLink || ''} onChange={handleHeroChange} style={styles.input} />
          <label>Background Image</label>
          <input type="file" accept="image/*" onChange={handleHeroImage} style={styles.input} />
          {uploadingImages.hero && <p style={styles.uploadStatus}>⏳ Uploading to Cloudinary...</p>}
          {content.hero?.backgroundImage && (
            <div>
              <img src={content.hero.backgroundImage} alt="Hero" style={styles.imagePreview} />
              <button onClick={() => setContent(prev => ({ ...prev, hero: { ...prev.hero, backgroundImage: '' } }))} style={{ ...styles.button, ...styles.deleteButton, marginTop: '8px' }}>Remove Image</button>
            </div>
          )}
        </div>
      )}

      {/* About Section */}
      {activeTab === 'about' && (
        <div style={styles.section}>
          <h3>About Text</h3>
          <textarea value={content.aboutText || ''} onChange={handleAboutChange} style={styles.textarea} rows="4" />
        </div>
      )}

      {/* Features Section */}
      {activeTab === 'features' && (
        <div style={styles.section}>
          <h3>Features</h3>
          {(content.features || []).map((f) => (
            <div key={f.id} style={styles.itemCard}>
              <input placeholder="Icon (emoji)" value={f.icon || ''} onChange={e => updateFeature(f.id, 'icon', e.target.value)} style={styles.input} />
              <input placeholder="Title" value={f.title || ''} onChange={e => updateFeature(f.id, 'title', e.target.value)} style={styles.input} />
              <textarea placeholder="Description" value={f.description || ''} onChange={e => updateFeature(f.id, 'description', e.target.value)} style={styles.input} rows="2" />
              <button onClick={() => removeFeature(f.id)} style={{ ...styles.button, ...styles.deleteButton }}>Remove</button>
            </div>
          ))}
          <button onClick={addFeature} style={styles.button}>+ Add Feature</button>
        </div>
      )}

      {/* Gallery Section */}
      {activeTab === 'gallery' && (
        <div style={styles.section}>
          <h3>Gallery</h3>
          {(content.gallery || []).map((g) => (
            <div key={g.id} style={styles.itemCard}>
              <input placeholder="Caption" value={g.caption || ''} onChange={e => updateGalleryItem(g.id, 'caption', e.target.value)} style={styles.input} />
              <input type="file" accept="image/*" onChange={e => handleGalleryImage(g.id, e.target.files[0])} style={styles.input} />
              {uploadingImages[g.id] && <p style={styles.uploadStatus}>⏳ Uploading to Cloudinary...</p>}
              {g.image && (
                <div>
                  <img src={g.image} alt="Gallery" style={styles.imagePreview} />
                  <button onClick={() => updateGalleryItem(g.id, 'image', '')} style={{ ...styles.button, ...styles.deleteButton, marginTop: '8px' }}>Remove Image</button>
                </div>
              )}
              <button onClick={() => removeGalleryItem(g.id)} style={{ ...styles.button, ...styles.deleteButton }}>Remove Item</button>
            </div>
          ))}
          <button onClick={addGalleryItem} style={styles.button}>+ Add Gallery Image</button>
        </div>
      )}

      {/* Videos Section */}
      {activeTab === 'videos' && (
        <div style={styles.section}>
          <h3>Training Videos</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            💡 Supports: YouTube, Vimeo, or any video embed URL. Thumbnails auto-generated for YouTube links.
          </p>
          {(content.trainingVideos || []).map((v) => (
            <div key={v.id} style={styles.itemCard}>
              <input 
                placeholder="Video Title" 
                value={v.title || ''} 
                onChange={e => updateVideo(v.id, 'title', e.target.value)} 
                style={styles.input} 
              />
              <input 
                placeholder="Video URL (YouTube embed or any video link)" 
                value={v.url || ''} 
                onChange={e => updateVideo(v.id, 'url', e.target.value)} 
                style={styles.input} 
              />
              {v.thumbnail && (
                <div style={{ marginTop: '8px' }}>
                  <img src={v.thumbnail} alt="Thumbnail" style={styles.thumbnail} />
                  <span style={{ fontSize: '11px', marginLeft: '8px', color: '#4caf50' }}>✓ Thumbnail generated</span>
                </div>
              )}
              <button onClick={() => removeVideo(v.id)} style={{ ...styles.button, ...styles.deleteButton }}>Remove</button>
            </div>
          ))}
          <button onClick={addVideo} style={styles.button}>+ Add Video</button>
        </div>
      )}

      {/* Social Links Section */}
      {activeTab === 'social' && (
        <div style={styles.section}>
          <h3>Social Media Links</h3>
          <input placeholder="Facebook URL" value={content.socialLinks?.facebook || ''} onChange={e => handleSocialChange('facebook', e.target.value)} style={styles.input} />
          <input placeholder="Instagram URL" value={content.socialLinks?.instagram || ''} onChange={e => handleSocialChange('instagram', e.target.value)} style={styles.input} />
          <input placeholder="Twitter URL" value={content.socialLinks?.twitter || ''} onChange={e => handleSocialChange('twitter', e.target.value)} style={styles.input} />
          <input placeholder="YouTube URL" value={content.socialLinks?.youtube || ''} onChange={e => handleSocialChange('youtube', e.target.value)} style={styles.input} />
        </div>
      )}

      {/* Testimonials Section */}
      {activeTab === 'testimonials' && (
        <div style={styles.section}>
          <h3>Testimonials</h3>
          {(content.testimonials || []).map((t) => (
            <div key={t.id} style={styles.itemCard}>
              <input placeholder="Name" value={t.name || ''} onChange={e => updateTestimonial(t.id, 'name', e.target.value)} style={styles.input} />
              <input placeholder="Role" value={t.role || ''} onChange={e => updateTestimonial(t.id, 'role', e.target.value)} style={styles.input} />
              <textarea placeholder="Testimonial text" value={t.text || ''} onChange={e => updateTestimonial(t.id, 'text', e.target.value)} style={styles.input} rows="3" />
              <label>Avatar Image</label>
              <input type="file" accept="image/*" onChange={e => handleTestimonialAvatar(t.id, e.target.files[0])} style={styles.input} />
              {uploadingImages[`avatar-${t.id}`] && <p style={styles.uploadStatus}>⏳ Uploading to Cloudinary...</p>}
              {t.avatar && <img src={t.avatar} alt="Avatar" style={styles.thumbnail} />}
              <button onClick={() => removeTestimonial(t.id)} style={{ ...styles.button, ...styles.deleteButton }}>Remove</button>
            </div>
          ))}
          <button onClick={addTestimonial} style={styles.button}>+ Add Testimonial</button>
        </div>
      )}

      <button onClick={saveChanges} disabled={saving} style={styles.saveButton}>
        {saving ? '💾 Saving...' : '💾 Save All Changes'}
      </button>
      
      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '12px' }}>
        ⚡ Changes will be visible immediately on the landing page.
      </p>
    </div>
  );
}

export default ManageLandingPage;