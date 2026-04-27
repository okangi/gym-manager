import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getVideos } from '../../services/videoService';
import { Modal, Spinner } from 'react-bootstrap';

function VideoLibrary() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [failedThumbnails, setFailedThumbnails] = useState({});

  useEffect(() => {
    loadVideos();
  }, [user?.branchId, token]);

  const loadVideos = async () => {
    setLoading(true);
    setError('');
    try {
      const allVideos = await getVideos(token);
      const videosArray = Array.isArray(allVideos) ? allVideos : [];
      
      // Filter by branch if needed
      const branchId = user?.branchId;
      const filteredVideos = branchId 
        ? videosArray.filter(v => !v.branchId || v.branchId === branchId)
        : videosArray;
      
      // Filter only active videos
      const activeVideos = filteredVideos.filter(v => v.isActive !== false);
      setVideos(activeVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
      setError('Failed to load videos. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeId = (url) => {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
      /youtube\.com\/shorts\/([^/?]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    
    // Already an embed URL
    if (url.includes('/embed/')) return url;
    
    // Cloudinary video URL
    if (url.includes('cloudinary.com')) return url;
    
    const videoId = getYouTubeId(url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url;
  };

  const getThumbnail = (video) => {
    // Use custom thumbnail if provided
    if (video.thumbnail) return video.thumbnail;
    
    // Check if this thumbnail already failed
    const thumbKey = `${video.id || video._id}`;
    if (failedThumbnails[thumbKey]) {
      return null;
    }
    
    // YouTube thumbnail
    if (video.url && video.url.includes('youtube')) {
      const videoId = getYouTubeId(video.url);
      if (videoId) {
        // Try different thumbnail qualities
        // maxresdefault.jpg (highest), sddefault.jpg, hqdefault.jpg, mqdefault.jpg, default.jpg
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    }
    
    // Cloudinary video thumbnail
    if (video.url && video.url.includes('cloudinary')) {
      return video.url.replace('/upload/', '/upload/w_300,h_200,c_fill/') + '.jpg';
    }
    
    return null;
  };

  const handleThumbnailError = (videoId) => {
    setFailedThumbnails(prev => ({
      ...prev,
      [videoId]: true
    }));
  };

  const openVideo = (video) => {
    const embedUrl = getYouTubeEmbedUrl(video.url);
    setSelectedVideo({ ...video, embedUrl });
    setShowModal(true);
  };

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    grid: { display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' },
    card: {
      backgroundColor: 'var(--card-bg)',
      borderRadius: '8px',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`
    },
    thumbnail: { width: '100%', height: '160px', objectFit: 'cover', backgroundColor: '#333' },
    thumbnailPlaceholder: {
      width: '100%',
      height: '160px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#f0f0f0',
      fontSize: '48px',
      color: theme === 'dark' ? '#aaa' : '#999'
    },
    info: { padding: '12px' },
    videoTitle: { color: theme === 'dark' ? '#fff' : '#1877f2', marginBottom: '8px', fontSize: '18px' },
    description: { color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' },
    category: { 
      color: theme === 'dark' ? '#aaa' : '#666', 
      fontSize: '12px',
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      backgroundColor: theme === 'dark' ? '#2a4a6e' : '#e9ecef'
    },
    videoBadge: {
      display: 'inline-block',
      marginLeft: '8px',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      backgroundColor: '#4caf50',
      color: 'white'
    },
    modalBody: { backgroundColor: 'var(--card-bg)', padding: '0' },
    modalContent: { padding: '12px', color: 'var(--text-secondary)' },
    iframe: { width: '100%', height: '450px', border: 'none' },
    cloudinaryVideo: { width: '100%', height: '450px' },
    loadingContainer: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' },
    errorText: { textAlign: 'center', padding: '20px', color: '#f44336' },
    emptyText: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Video Library</h2>
        <div style={styles.loadingContainer}>
          <Spinner animation="border" variant="primary" />
          <p>Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Video Library</h2>
        <div style={styles.errorText}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎥 Video Library</h2>
      
      {videos.length === 0 ? (
        <div style={styles.emptyText}>
          No videos available at this time. Check back later for workout tutorials and nutrition guides.
        </div>
      ) : (
        <div style={styles.grid}>
          {videos.map(video => {
            const videoKey = video.id || video._id;
            const thumbnail = getThumbnail(video);
            const isCloudinary = video.url?.includes('cloudinary');
            const hasValidThumbnail = thumbnail && !failedThumbnails[videoKey];
            
            return (
              <div 
                key={videoKey} 
                style={styles.card} 
                onClick={() => openVideo(video)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {hasValidThumbnail ? (
                  <img 
                    src={thumbnail} 
                    alt={video.title} 
                    style={styles.thumbnail}
                    onError={() => handleThumbnailError(videoKey)}
                  />
                ) : (
                  <div style={styles.thumbnailPlaceholder}>
                    🎬
                  </div>
                )}
                <div style={styles.info}>
                  <h3 style={styles.videoTitle}>{video.title}</h3>
                  <p style={styles.description}>{video.description?.substring(0, 80)}...</p>
                  <span style={styles.category}>{video.category || 'Workout'}</span>
                  {isCloudinary && <span style={styles.videoBadge}>☁️ HD</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton style={{ 
          backgroundColor: 'var(--card-bg)', 
          borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}` 
        }}>
          <Modal.Title style={{ color: 'var(--text-primary)' }}>
            {selectedVideo?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={styles.modalBody}>
          {selectedVideo && (
            <>
              {selectedVideo.url?.includes('cloudinary.com') ? (
                <video 
                  controls 
                  style={styles.cloudinaryVideo}
                  poster={getThumbnail(selectedVideo)}
                >
                  <source src={selectedVideo.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  src={selectedVideo.embedUrl}
                  title={selectedVideo.title}
                  style={styles.iframe}
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              )}
              <div style={styles.modalContent}>
                <p>{selectedVideo?.description}</p>
                {selectedVideo?.category && (
                  <p><strong>Category:</strong> {selectedVideo.category}</p>
                )}
                {selectedVideo?.trainerName && (
                  <p><strong>Trainer:</strong> {selectedVideo.trainerName}</p>
                )}
                {selectedVideo?.url?.includes('cloudinary') && (
                  <p><span style={{ color: '#4caf50' }}>✓ Hosted on Cloudinary - Premium quality</span></p>
                )}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default VideoLibrary;