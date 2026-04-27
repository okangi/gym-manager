const API_BASE_URL = 'http://localhost:5000/api';

const videoFetch = async (endpoint, method = 'GET', data = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'API call failed');
  }
  
  return result;
};

// Get all videos - with optional token for authenticated requests
export const getVideos = async (token = null) => {
  try {
    // If token is provided, use it for authenticated request
    const response = await videoFetch('/videos', 'GET', null, token);
    return response.videos || [];
  } catch (error) {
    console.error('Error fetching videos:', error);
    if (error.message.includes('404')) {
      return [];
    }
    return JSON.parse(localStorage.getItem('gym_videos') || '[]');
  }
};

// Get videos for trainer (filtered by trainer ID or branch)
export const getTrainerVideos = async (trainerId, branchId, token) => {
  try {
    const response = await videoFetch(`/videos/trainer/${trainerId}?branchId=${branchId || ''}`, 'GET', null, token);
    return response.videos || [];
  } catch (error) {
    console.error('Error fetching trainer videos:', error);
    const allVideos = JSON.parse(localStorage.getItem('gym_videos') || '[]');
    return allVideos.filter(v => v.trainerId === trainerId || v.branchId === branchId);
  }
};

// Get video by ID
export const getVideoById = async (id, token = null) => {
  try {
    const response = await videoFetch(`/videos/${id}`, 'GET', null, token);
    return response.video;
  } catch (error) {
    console.error('Error fetching video:', error);
    const videos = JSON.parse(localStorage.getItem('gym_videos') || '[]');
    return videos.find(v => v.id === id || v._id === id);
  }
};

// Create video (Trainer/Admin)
export const createVideo = async (videoData, token) => {
  if (!token) {
    console.error('No token provided for createVideo');
    return null;
  }
  
  try {
    const response = await videoFetch('/videos', 'POST', videoData, token);
    if (response.success && response.video) {
      // Update localStorage backup
      const videos = JSON.parse(localStorage.getItem('gym_videos') || '[]');
      videos.push(response.video);
      localStorage.setItem('gym_videos', JSON.stringify(videos));
      return response.video;
    }
    throw new Error(response.message || 'Failed to create video');
  } catch (error) {
    console.error('Error creating video:', error);
    // Fallback to localStorage
    const videos = JSON.parse(localStorage.getItem('gym_videos') || '[]');
    const newVideo = { ...videoData, id: Date.now(), _id: Date.now().toString(), createdAt: new Date().toISOString() };
    videos.push(newVideo);
    localStorage.setItem('gym_videos', JSON.stringify(videos));
    return newVideo;
  }
};

// Update video (Trainer/Admin)
export const updateVideo = async (id, videoData, token) => {
  if (!token) {
    console.error('No token provided for updateVideo');
    return null;
  }
  
  try {
    console.log('Updating video with ID:', id);
    console.log('Update data:', videoData);
    
    const response = await videoFetch(`/videos/${id}`, 'PUT', videoData, token);
    
    console.log('Update response:', response);
    
    if (response.success && response.video) {
      // Update localStorage backup
      const videos = JSON.parse(localStorage.getItem('gym_videos') || '[]');
      const updatedVideos = videos.map(v => 
        (v.id === id || v._id === id) ? response.video : v
      );
      localStorage.setItem('gym_videos', JSON.stringify(updatedVideos));
      return response.video;
    }
    throw new Error(response.message || 'Failed to update video');
  } catch (error) {
    console.error('Error updating video:', error);
    // Fallback to localStorage
    const videos = JSON.parse(localStorage.getItem('gym_videos') || '[]');
    const updatedVideos = videos.map(v => 
      (v.id === id || v._id === id) ? { ...v, ...videoData, updatedAt: new Date().toISOString() } : v
    );
    localStorage.setItem('gym_videos', JSON.stringify(updatedVideos));
    return { id, ...videoData };
  }
};

// Delete video
export const deleteVideo = async (id, token) => {
  if (!token) {
    console.error('No token provided for deleteVideo');
    return false;
  }
  
  try {
    console.log('Deleting video with ID:', id);
    
    await videoFetch(`/videos/${id}`, 'DELETE', null, token);
    
    // Update localStorage backup
    const videos = JSON.parse(localStorage.getItem('gym_videos') || '[]');
    const filtered = videos.filter(v => v.id !== id && v._id !== id);
    localStorage.setItem('gym_videos', JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting video:', error);
    // Fallback to localStorage
    const videos = JSON.parse(localStorage.getItem('gym_videos') || '[]');
    const filtered = videos.filter(v => v.id !== id && v._id !== id);
    localStorage.setItem('gym_videos', JSON.stringify(filtered));
    return true;
  }
};

// Initialize default videos
export const initDefaultVideos = async (token) => {
  if (!token) return;
  
  const videos = await getVideos(token);
  if (videos.length === 0) {
    const defaultVideos = [
      { 
        title: 'Introduction to Fitness', 
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        description: 'Getting started guide', 
        category: 'Workout',
        isActive: true
      },
      { 
        title: 'Cardio Workout', 
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', 
        description: '30 min cardio session', 
        category: 'Cardio',
        isActive: true
      }
    ];
    for (const video of defaultVideos) {
      await createVideo(video, token);
    }
  }
};

// ============ ALIASES FOR COMPONENTS ============
export const saveVideo = createVideo;
export const getAllVideos = getVideos;