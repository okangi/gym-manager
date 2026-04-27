import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Avatar({ 
  size = 40, 
  userId, 
  userName, 
  userEmail,
  imageUrl, 
  onClick,
  showStatus = false,
  status = 'offline', // 'online', 'offline', 'away', 'busy'
  border = false
}) {
  const { user: currentUser } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Use provided image or current user's image
  const profileImage = imageUrl || currentUser?.profilePicture;
  const name = userName || currentUser?.name;
  const email = userEmail || currentUser?.email;
  
  const getInitial = () => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };
  
  const getStatusColor = () => {
    switch (status) {
      case 'online': return '#4caf50';
      case 'away': return '#ff9800';
      case 'busy': return '#f44336';
      default: return '#9e9e9e';
    }
  };
  
  const styles = {
    container: {
      position: 'relative',
      display: 'inline-block',
      cursor: onClick ? 'pointer' : 'default'
    },
    avatar: {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      objectFit: 'cover',
      transition: 'transform 0.2s, box-shadow 0.2s',
      ...(border && {
        border: `2px solid ${isDark ? '#4caf50' : '#1877f2'}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      })
    },
    defaultAvatar: {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      backgroundColor: '#1877f2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: `${size * 0.4}px`,
      fontWeight: 'bold',
      transition: 'transform 0.2s, box-shadow 0.2s',
      ...(border && {
        border: `2px solid ${isDark ? '#4caf50' : '#1877f2'}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      })
    },
    statusDot: {
      position: 'absolute',
      bottom: '2px',
      right: '2px',
      width: `${Math.max(8, size * 0.2)}px`,
      height: `${Math.max(8, size * 0.2)}px`,
      borderRadius: '50%',
      backgroundColor: getStatusColor(),
      border: `2px solid ${isDark ? '#1e2a3a' : 'white'}`,
      zIndex: 1
    },
    tooltip: {
      position: 'absolute',
      bottom: 'calc(100% + 5px)',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: isDark ? '#1e2a3a' : '#333',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      whiteSpace: 'nowrap',
      zIndex: 1000,
      pointerEvents: 'none',
      opacity: 0,
      transition: 'opacity 0.2s'
    }
  };
  
  const handleMouseEnter = (e) => {
    const tooltip = e.currentTarget.querySelector('.avatar-tooltip');
    if (tooltip) tooltip.style.opacity = '1';
  };
  
  const handleMouseLeave = (e) => {
    const tooltip = e.currentTarget.querySelector('.avatar-tooltip');
    if (tooltip) tooltip.style.opacity = '0';
  };
  
  const avatarContent = profileImage ? (
    <img 
      src={profileImage} 
      alt={name || 'Avatar'} 
      style={styles.avatar}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  ) : (
    <div 
      style={styles.defaultAvatar}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {getInitial()}
    </div>
  );
  
  return (
    <div 
      style={styles.container} 
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {avatarContent}
      {showStatus && <div style={styles.statusDot} />}
      
      {/* Tooltip with user info */}
      <div className="avatar-tooltip" style={styles.tooltip}>
        <div><strong>{name || email}</strong></div>
        {status !== 'offline' && (
          <div style={{ fontSize: '10px', opacity: 0.8 }}>
            {status === 'online' ? '🟢 Online' : status === 'away' ? '🟡 Away' : status === 'busy' ? '🔴 Busy' : '⚫ Offline'}
          </div>
        )}
      </div>
    </div>
  );
}