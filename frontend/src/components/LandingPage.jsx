import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getLandingContent } from '../services/landingService';
import { getGymSettings } from '../services/gymSettingsService';
import ContactForm from './ContactForm';
import AOS from 'aos';
import 'aos/dist/aos.css';

function LandingPage() {
  const { theme } = useTheme();
  const [content, setContent] = useState(null);
  const [gymSettings, setGymSettings] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const landingContent = await getLandingContent();
        const settings = await getGymSettings();
        
        console.log('Loaded landing content:', landingContent);
        console.log('Loaded gym settings:', settings);
        
        setContent(landingContent);
        setGymSettings(settings);
        
        setTimeout(() => AOS.init({ duration: 800, once: true, offset: 100 }), 100);
      } catch (error) {
        console.error('Error loading landing page data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Loading...</h2>
        <p>Please wait while we load the page content.</p>
      </div>
    );
  }

  if (!content || !gymSettings) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Unable to load content</h2>
        <p>Please refresh the page or try again later.</p>
      </div>
    );
  }

  const isDark = theme === 'dark';

  const getYouTubeVideoId = (url) => {
    const patterns = [
      /embed\/([a-zA-Z0-9_-]{11})/,
      /shorts\/([a-zA-Z0-9_-]{11})/,
      /[?&]v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const getYouTubeThumbnail = (url) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
  };

  const getEmbedUrl = (url) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const styles = {
    container: { 
      fontFamily: 'Poppins, Arial, sans-serif', 
      backgroundColor: isDark ? '#0a0f1e' : '#f8fafc',
      overflowX: 'hidden'
    },
    
    hero: {
      background: content.hero?.backgroundImage 
        ? `linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.7) 100%), url(${content.hero.backgroundImage})`
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '90vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    },
    heroContent: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
    heroTitle: { 
      fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', 
      marginBottom: '20px',
      fontWeight: '800',
      textShadow: '2px 2px 15px rgba(0,0,0,0.3)',
      letterSpacing: '-0.02em',
      color: '#fff'
    },
    heroSubtitle: { 
      fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', 
      marginBottom: '32px',
      color: 'rgba(255,255,255,0.95)',
      lineHeight: '1.6'
    },
    ctaButton: { 
      padding: '14px 36px', 
      backgroundColor: '#ff6b35', 
      color: '#fff', 
      borderRadius: '50px', 
      textDecoration: 'none',
      fontWeight: '600',
      fontSize: '1.1rem',
      display: 'inline-block',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
    },
    
    section: { padding: '80px 20px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' },
    sectionTitle: { 
      fontSize: 'clamp(2rem, 5vw, 2.8rem)', 
      fontWeight: '700', 
      marginBottom: '16px',
      background: isDark ? 'linear-gradient(135deg, #fff, #a0aec0)' : 'linear-gradient(135deg, #1e2a3a, #4a5568)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent'
    },
    sectionSubtitle: { 
      fontSize: '1.2rem', 
      color: isDark ? '#cbd5e1' : '#4a5568', 
      maxWidth: '700px', 
      margin: '0 auto 50px',
      lineHeight: '1.6'
    },
    
    aboutText: { 
      fontSize: '1.2rem', 
      lineHeight: '1.8', 
      color: isDark ? '#e2e8f0' : '#2d3748', 
      maxWidth: '800px', 
      margin: '0 auto',
      textAlign: 'center'
    },
    
    featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginTop: '40px' },
    featureCard: { 
      backgroundColor: isDark ? '#1e293b' : '#fff', 
      padding: '35px 25px', 
      borderRadius: '20px', 
      boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.3)' : '0 10px 25px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      textAlign: 'center',
      cursor: 'pointer'
    },
    featureIcon: { fontSize: '3.5rem', marginBottom: '20px', display: 'block' },
    featureTitle: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '12px', color: isDark ? '#fff' : '#1e2a3a' },
    featureDesc: { color: isDark ? '#cbd5e1' : '#4a5568', lineHeight: '1.6' },
    
    galleryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px', marginTop: '40px' },
    galleryImage: { width: '100%', height: '280px', objectFit: 'cover', borderRadius: '16px', transition: 'transform 0.5s ease' },
    galleryCaption: { marginTop: '12px', fontWeight: '500', color: isDark ? '#cbd5e1' : '#4a5568' },
    
    videoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginTop: '40px' },
    videoCard: { 
      backgroundColor: isDark ? '#1e293b' : '#fff', 
      borderRadius: '16px', 
      overflow: 'hidden',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      transition: 'transform 0.3s ease',
      cursor: 'pointer'
    },
    videoThumbnail: { width: '100%', height: '200px', objectFit: 'cover', transition: 'transform 0.3s ease' },
    videoTitle: { padding: '15px', fontWeight: '600', textAlign: 'center', color: isDark ? '#fff' : '#1e2a3a' },
    
    testimonialsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px', marginTop: '40px' },
    testimonialCard: { 
      backgroundColor: isDark ? '#1e293b' : '#fff', 
      padding: '30px', 
      borderRadius: '20px', 
      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease',
      textAlign: 'center'
    },
    testimonialAvatar: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px', border: '3px solid #ff6b35' },
    testimonialText: { fontSize: '1rem', lineHeight: '1.6', color: isDark ? '#cbd5e1' : '#2d3748', marginBottom: '20px', fontStyle: 'italic' },
    testimonialName: { fontWeight: '700', fontSize: '1.1rem', marginBottom: '4px', color: isDark ? '#fff' : '#1e2a3a' },
    testimonialRole: { fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#64748b' },
    
    socialLinks: { display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginTop: '30px' },
    socialIcon: { 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '10px', 
      padding: '12px 28px', 
      backgroundColor: isDark ? '#1e293b' : '#e2e8f0', 
      color: isDark ? '#fff' : '#1e2a3a', 
      textDecoration: 'none', 
      borderRadius: '50px', 
      fontWeight: '500',
      transition: 'all 0.3s ease'
    },
    
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.95)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    modalContent: {
      position: 'relative',
      maxWidth: '90%',
      width: '800px',
      backgroundColor: isDark ? '#1e293b' : '#fff',
      borderRadius: '16px',
      padding: '20px'
    },
    modalClose: {
      position: 'absolute',
      top: '10px',
      right: '20px',
      background: 'none',
      border: 'none',
      fontSize: '28px',
      cursor: 'pointer',
      color: isDark ? '#fff' : '#333'
    },
    modalIframe: {
      width: '100%',
      height: '450px',
      border: 'none',
      borderRadius: '8px'
    },
    modalTitle: {
      marginTop: '16px',
      color: isDark ? '#fff' : '#333',
      textAlign: 'center'
    },
    
    footer: { 
      backgroundColor: isDark ? '#0f172a' : '#e2e8f0', 
      padding: '50px 20px', 
      textAlign: 'center', 
      marginTop: '60px',
      borderTop: `1px solid ${isDark ? '#1e293b' : '#cbd5e1'}`
    },
    footerText: { color: isDark ? '#94a3b8' : '#475569', marginBottom: '8px' }
  };

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero} data-aos="fade-in">
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>{content.hero?.title || 'Welcome to Our Gym'}</h1>
          <p style={styles.heroSubtitle}>{content.hero?.subtitle || 'Transform your fitness journey'}</p>
          <Link to={content.hero?.buttonLink || '/register'} style={styles.ctaButton}>
            {content.hero?.buttonText || 'Join Now'}
          </Link>
        </div>
      </div>

      {/* About Section */}
      <div style={styles.section} data-aos="fade-up">
        <h2 style={styles.sectionTitle}>About Us</h2>
        <p style={styles.aboutText}>{content.aboutText || 'We provide the best fitness experience with modern equipment and expert trainers.'}</p>
      </div>

      {/* Features Section */}
      <div style={styles.section} data-aos="fade-up">
        <h2 style={styles.sectionTitle}>Why Choose Us</h2>
        <p style={styles.sectionSubtitle}>Experience excellence with our premium services</p>
        <div style={styles.featuresGrid}>
          {content.features && content.features.map((f, idx) => (
            <div key={f.id || `feature-${idx}`} style={styles.featureCard} data-aos="zoom-in">
              <div style={styles.featureIcon}>{f.icon || '💪'}</div>
              <h3 style={styles.featureTitle}>{f.title || 'Feature'}</h3>
              <p style={styles.featureDesc}>{f.description || 'Great service'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Gallery Section */}
      {content.gallery && content.gallery.length > 0 && (
        <div style={styles.section} data-aos="fade-up">
          <h2 style={styles.sectionTitle}>Our Gym</h2>
          <p style={styles.sectionSubtitle}>Take a virtual tour of our state-of-the-art facility</p>
          <div style={styles.galleryGrid}>
            {content.gallery.map((g, idx) => (
              <div key={g.id || `gallery-${idx}`} data-aos="flip-left">
                <img src={g.image} alt={g.caption} style={styles.galleryImage} />
                <p style={styles.galleryCaption}>{g.caption}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training Videos */}
      {content.trainingVideos && content.trainingVideos.length > 0 && (
        <div style={styles.section} data-aos="fade-up">
          <h2 style={styles.sectionTitle}>Training Videos</h2>
          <p style={styles.sectionSubtitle}>Learn from our expert trainers</p>
          <div style={styles.videoGrid}>
            {content.trainingVideos.map((v, idx) => {
              const thumb = getYouTubeThumbnail(v.url);
              return (
                <div key={v.id || `video-${idx}`} style={styles.videoCard} onClick={() => { setSelectedVideo(v); setShowVideoModal(true); }} data-aos="zoom-in">
                  {thumb ? (
                    <img src={thumb} alt={v.title} style={styles.videoThumbnail} />
                  ) : (
                    <div style={{ ...styles.videoThumbnail, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', color: '#fff' }}>
                      🎬 Video Unavailable
                    </div>
                  )}
                  <div style={styles.videoTitle}>{v.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div style={styles.modalOverlay} onClick={() => setShowVideoModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setShowVideoModal(false)}>✕</button>
            <iframe 
              src={getEmbedUrl(selectedVideo.url)} 
              title={selectedVideo.title} 
              style={styles.modalIframe} 
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
            <h3 style={styles.modalTitle}>{selectedVideo.title}</h3>
          </div>
        </div>
      )}

      {/* Testimonials Section */}
      {content.testimonials && content.testimonials.length > 0 && (
        <div style={styles.section} data-aos="fade-up">
          <h2 style={styles.sectionTitle}>What Our Members Say</h2>
          <p style={styles.sectionSubtitle}>Real stories from real people</p>
          <div style={styles.testimonialsGrid}>
            {content.testimonials.map((t, idx) => (
              <div key={t.id || `testimonial-${idx}`} style={styles.testimonialCard} data-aos="zoom-in">
                {t.avatar && <img src={t.avatar} alt={t.name} style={styles.testimonialAvatar} />}
                <p style={styles.testimonialText}>"{t.text}"</p>
                <h4 style={styles.testimonialName}>{t.name}</h4>
                <p style={styles.testimonialRole}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Links Section */}
      <div style={styles.section} data-aos="fade-up">
        <h2 style={styles.sectionTitle}>Follow Us</h2>
        <p style={styles.sectionSubtitle}>Stay connected for updates and fitness tips</p>
        <div style={styles.socialLinks}>
          {content.socialLinks?.facebook && (
            <a href={content.socialLinks.facebook} target="_blank" rel="noopener noreferrer" style={styles.socialIcon}>
              📘 Facebook
            </a>
          )}
          {content.socialLinks?.instagram && (
            <a href={content.socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={styles.socialIcon}>
              📸 Instagram
            </a>
          )}
          {content.socialLinks?.twitter && (
            <a href={content.socialLinks.twitter} target="_blank" rel="noopener noreferrer" style={styles.socialIcon}>
              ✖️ Twitter
            </a>
          )}
          {content.socialLinks?.youtube && (
            <a href={content.socialLinks.youtube} target="_blank" rel="noopener noreferrer" style={styles.socialIcon}>
              ▶️ YouTube
            </a>
          )}
        </div>
      </div>

      {/* Contact Form Section */}
      <div style={styles.section} data-aos="fade-up">
        <h2 style={styles.sectionTitle}>Contact Us</h2>
        <p style={styles.sectionSubtitle}>Have questions? We'd love to hear from you.</p>
        <ContactForm />
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', color: isDark ? '#fff' : '#1e2a3a' }}>
          {gymSettings.name || 'Gym Manager'}
        </h3>
        <p style={styles.footerText}>{gymSettings.address || 'Nairobi, Kenya'}</p>
        <p style={styles.footerText}>Phone: {gymSettings.phone || '+254 700 000 000'}</p>
        <p style={styles.footerText}>Email: {gymSettings.email || 'info@gym.com'}</p>
        <p style={styles.footerText}>&copy; {new Date().getFullYear()} {gymSettings.name || 'Gym Manager'}. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;