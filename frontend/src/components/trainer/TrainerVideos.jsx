import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getVideos, createVideo, updateVideo, deleteVideo } from '../../services/videoService';
import { addActivityLog } from '../../services/activityLogger';

function TrainerVideos() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [videos, setVideos] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    category: 'Workout'
  });

  useEffect(() => {
    loadVideos();
  }, [token, user?.branchId, user?.id]);

  const loadVideos = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      // Get all videos (public) - backend will filter by trainer based on token
      const allVideos = await getVideos(token);
      const videosArray = Array.isArray(allVideos) ? allVideos : [];
      
      // Filter videos for this trainer
      // Videos visible to trainer: their own videos OR videos for their branch
      const myVideos = videosArray.filter(video => {
        // Trainer's own videos
        if (video.trainerId === user?.id || video.trainerId === user?._id) return true;
        // Videos for trainer's branch
        if (user?.branchId && video.branchId === user?.branchId) return true;
        // Public videos (no trainerId and no branchId)
        if (!video.trainerId && !video.branchId) return true;
        return false;
      });
      
      console.log(`Loaded ${myVideos.length} videos for trainer`);
      setVideos(myVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
      setError('Failed to load videos. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get Cloudinary upload preset from environment
  const getUploadPreset = () => {
    // Use a default preset or get from env
    return 'gym_videos';
  };

  // Upload video to Cloudinary
  const uploadVideoToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', getUploadPreset());
    formData.append('cloud_name', 'dxmri3zzr');
    formData.append('resource_type', 'video');
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.cloudinary.com/v1_1/dxmri3zzr/video/upload', true);
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } else {
          reject(new Error('Upload failed'));
        }
      };
      
      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.send(formData);
    });
  };

  // Upload thumbnail to Cloudinary
  const uploadThumbnailToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', getUploadPreset());
    formData.append('cloud_name', 'dxmri3zzr');
    
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dxmri3zzr/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Thumbnail upload error:', error);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVideoFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedVideoFile(file);
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      setFormData(prev => ({ ...prev, title: fileName }));
    }
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedThumbnailFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setUploadProgress(0);
    setError('');
    setSuccess('');
    
    try {
      let videoUrl = formData.url;
      let thumbnailUrl = '';
      
      if (selectedVideoFile) {
        setUploadingVideo(true);
        videoUrl = await uploadVideoToCloudinary(selectedVideoFile);
      }
      
      if (!videoUrl) {
        setError('Please provide a video file or YouTube URL');
        setSaving(false);
        return;
      }
      
      if (selectedThumbnailFile) {
        thumbnailUrl = await uploadThumbnailToCloudinary(selectedThumbnailFile);
      } else if (videoUrl && (videoUrl.includes('youtube') || videoUrl.includes('youtu.be'))) {
        thumbnailUrl = getYouTubeThumbnail(videoUrl);
      }
      
      const videoData = {
        title: formData.title,
        description: formData.description,
        url: videoUrl,
        category: formData.category,
        thumbnail: thumbnailUrl,
        trainerId: user?.id || user?._id,
        trainerName: user?.name,
        branchId: user?.branchId,
        isActive: true
      };
      
      let result;
      if (editingId) {
        result = await updateVideo(editingId, videoData, token);
        await addActivityLog(user?.email, 'Video Edit', `Updated video ${formData.title}`, token);
        setSuccess('Video updated successfully!');
      } else {
        result = await createVideo(videoData, token);
        await addActivityLog(user?.email, 'Video Create', `Created video ${formData.title}`, token);
        setSuccess('Video created successfully!');
      }
      
      resetForm();
      await loadVideos();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving video:', error);
      setError('Failed to save video. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
      setUploadingVideo(false);
      setSelectedVideoFile(null);
      setSelectedThumbnailFile(null);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', url: '', category: 'Workout' });
    setSelectedVideoFile(null);
    setSelectedThumbnailFile(null);
    setUploadProgress(0);
  };

  const handleEdit = (video) => {
    setEditingId(video.id || video._id);
    setFormData({
      title: video.title || '',
      description: video.description || '',
      url: video.url || '',
      category: video.category || 'Workout'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Delete video "${title}"? This action cannot be undone.`)) {
      try {
        await deleteVideo(id, token);
        await addActivityLog(user?.email, 'Video Delete', `Deleted video ${title}`, token);
        setSuccess(`Video "${title}" deleted successfully!`);
        await loadVideos();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting video:', error);
        setError('Failed to delete video. Please try again.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const getVideoSourceType = (url) => {
    if (!url) return 'none';
    if (url.includes('cloudinary.com')) return 'cloudinary';
    if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube';
    return 'url';
  };

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    form: { marginBottom: '30px', padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '8px' },
    input: { display: 'block', width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`, backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', color: theme === 'dark' ? '#eee' : '#333' },
    textarea: { display: 'block', width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`, backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', color: theme === 'dark' ? '#eee' : '#333' },
    select: { display: 'block', width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`, backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', color: theme === 'dark' ? '#eee' : '#333' },
    button: { padding: '8px 16px', backgroundColor: '#1877f2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px', marginTop: '8px' },
    cancelButton: { backgroundColor: '#6c757d' },
    deleteButton: { backgroundColor: '#dc3545', color: 'white' },
    videoList: { display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' },
    videoCard: { padding: '16px', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)', color: theme === 'dark' ? '#eee' : '#333' },
    thumbnail: { width: '100%', height: '160px', objectFit: 'cover', borderRadius: '4px', marginBottom: '12px', backgroundColor: '#333' },
    thumbnailPlaceholder: { width: '100%', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme === 'dark' ? '#2a4a6e' : '#e9ecef', color: '#666', fontSize: '14px' },
    loadingText: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' },
    uploadProgress: { width: '100%', height: '4px', backgroundColor: '#e0e0e0', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#4caf50', transition: 'width 0.3s ease' },
    fileInputLabel: { display: 'block', padding: '10px', backgroundColor: theme === 'dark' ? '#2a4a6e' : '#e9ecef', borderRadius: '4px', textAlign: 'center', cursor: 'pointer', marginBottom: '10px' },
    hr: { margin: '15px 0', borderColor: theme === 'dark' ? '#444' : '#ddd' },
    sectionTitle: { fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-secondary)' },
    badge: { display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginLeft: '8px' },
    badgeCloudinary: { backgroundColor: '#4caf50', color: 'white' },
    badgeYouTube: { backgroundColor: '#ff0000', color: 'white' },
    success: { backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px', marginBottom: '15px' },
    error: { backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '4px', marginBottom: '15px' }
  };

  if (loading) {
    return <div style={styles.loadingText}>Loading videos...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Manage Video Library</h2>
      
      {success && <div style={styles.success}>{success}</div>}
      {error && <div style={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <h3>{editingId ? '✏️ Edit Video' : '🎬 Add New Video'}</h3>
        
        <div style={styles.sectionTitle}>Upload Video File (MP4, MOV, etc.)</div>
        <div style={styles.fileInputLabel}>
          📹 {selectedVideoFile ? selectedVideoFile.name : 'Click to select video file'}
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoFileSelect}
            style={{ display: 'none' }}
            id="videoFileInput"
          />
        </div>
        <button type="button" onClick={() => document.getElementById('videoFileInput').click()} style={styles.button}>
          Choose Video File
        </button>
        
        <div style={styles.sectionTitle}>Custom Thumbnail (Optional)</div>
        <div style={styles.fileInputLabel}>
          🖼️ {selectedThumbnailFile ? selectedThumbnailFile.name : 'Click to select thumbnail image'}
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailSelect}
            style={{ display: 'none' }}
            id="thumbnailInput"
          />
        </div>
        <button type="button" onClick={() => document.getElementById('thumbnailInput').click()} style={styles.button}>
          Choose Thumbnail
        </button>
        
        <div style={styles.hr} />
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>— OR —</p>
        <div style={styles.hr} />
        
        <div style={styles.sectionTitle}>YouTube URL</div>
        <input
          name="url"
          placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
          value={formData.url}
          onChange={handleChange}
          style={styles.input}
        />
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '-8px', marginBottom: '10px' }}>
          💡 Supports: youtube.com/watch, youtu.be, youtube.com/embed, youtube.com/shorts
        </p>
        
        {uploadingVideo && (
          <div style={styles.uploadProgress}>
            <div style={{ ...styles.progressBar, width: `${uploadProgress}%` }} />
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Uploading video to Cloudinary: {uploadProgress}%</p>
          </div>
        )}
        
        <input
          name="title"
          placeholder="Video Title"
          value={formData.title}
          onChange={handleChange}
          required
          style={styles.input}
        />
        
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          style={styles.textarea}
        />
        
        <select name="category" value={formData.category} onChange={handleChange} style={styles.select}>
          <option>Workout</option>
          <option>Nutrition</option>
          <option>Safety</option>
          <option>Wellness</option>
          <option>Yoga</option>
          <option>Cardio</option>
          <option>Strength</option>
        </select>
        
        <div>
          <button type="submit" style={styles.button} disabled={saving}>
            {saving ? 'Saving...' : (editingId ? 'Update Video' : 'Create Video')}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ ...styles.button, ...styles.cancelButton }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3>Your Videos ({videos.length})</h3>
      <div style={styles.videoList}>
        {videos.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
            No videos yet. Add your first training video above!
          </p>
        )}
        {videos.map(video => {
          const sourceType = getVideoSourceType(video.url);
          const videoId = video.id || video._id;
          const hasThumbnail = video.thumbnail && video.thumbnail !== '';
          
          return (
            <div key={videoId} style={styles.videoCard}>
              {hasThumbnail ? (
                <img src={video.thumbnail} alt={video.title} style={styles.thumbnail} />
              ) : (
                <div style={styles.thumbnailPlaceholder}>
                  🎬 No Thumbnail
                </div>
              )}
              <h3>
                {video.title}
                {sourceType === 'cloudinary' && <span style={{ ...styles.badge, ...styles.badgeCloudinary }}>☁️ Cloudinary</span>}
                {sourceType === 'youtube' && <span style={{ ...styles.badge, ...styles.badgeYouTube }}>▶️ YouTube</span>}
              </h3>
              <p>{video.description}</p>
              <p><strong>Category:</strong> {video.category}</p>
              <button onClick={() => handleEdit(video)} style={styles.button}>✏️ Edit</button>
              <button onClick={() => handleDelete(videoId, video.title)} style={{ ...styles.button, ...styles.deleteButton }}>🗑️ Delete</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TrainerVideos;