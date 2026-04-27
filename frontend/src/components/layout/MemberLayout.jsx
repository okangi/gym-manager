import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Navbar as BSNavbar, Container, Button, Offcanvas } from 'react-bootstrap';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../common/NotificationBell';
import { getGymSettings } from '../../services/gymSettingsService';

function MemberLayout() {
  const { user } = useAuth(); // Get user from auth
  const { theme, toggleTheme } = useTheme(); // Get theme separately
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);
  const [gymSettings, setGymSettings] = useState({ name: 'Gym Manager', logo: null });

  useState(() => {
    setGymSettings(getGymSettings());
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/member/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/member/membership', label: 'Membership', icon: '💳' },
    { to: '/member/card', label: 'My Card', icon: '🪪' },
    { to: '/member/checkin', label: 'Check-in', icon: '✅' },
    { to: '/member/classes', label: 'Classes', icon: '📅' },
    { to: '/member/my-bookings', label: 'My Bookings', icon: '📖' },
    { to: '/member/private-sessions', label: 'Private Sessions', icon: '🤝' },
    { to: '/member/payments', label: 'Payments', icon: '💰' },
    { to: '/member/trainers', label: 'Trainers', icon: '🏋️' },
    { to: '/member/my-plans', label: 'My Plans', icon: '📋' },
    { to: '/member/chat', label: 'Chat', icon: '💬' },
    { to: '/member/progress', label: 'Progress', icon: '📈' },
    { to: '/member/videos', label: 'Video Library', icon: '🎥' },
    { to: '/member/profile', label: 'Profile', icon: '👤' },
    { to: '/member/export', label: 'Export', icon: '📥' },
    { to: '/member/contact', label: 'Contact', icon: '📞' }
  ];

  const handleClose = () => setShowSidebar(false);
  const handleShow = () => setShowSidebar(true);

  return (
    <div style={styles.container}>
      {/* Top Navbar with hamburger, brand, theme toggle, and logout */}
      <BSNavbar bg={theme === 'light' ? 'light' : 'dark'} variant={theme === 'light' ? 'light' : 'dark'} expand="lg" className="member-navbar">
        <Container fluid>
          <Button variant="outline-secondary" onClick={handleShow} className="hamburger-btn" style={{ marginRight: '12px' }}>
            ☰
          </Button>
          <BSNavbar.Brand href="/member/dashboard" style={{ display: 'flex', alignItems: 'center' }}>
            {gymSettings.logo && <img src={gymSettings.logo} alt="Logo" style={{ height: '30px', marginRight: '8px' }} />}
            {gymSettings.name}
          </BSNavbar.Brand>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <NotificationBell />
            <div style={{ cursor: 'pointer' }} onClick={() => navigate('/member/profile')}>
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    objectFit: 'cover',
                    border: '2px solid #1877f2'
                  }}
                />
              ) : (
                <div 
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    backgroundColor: '#1877f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={toggleTheme} 
              style={{ width: 'auto' }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </Button>
            <Button variant="outline-danger" size="sm" onClick={handleLogout} style={{ width: 'auto' }}>
              Logout
            </Button>
          </div>
        </Container>
      </BSNavbar>

      {/* Rest of your component remains the same */}
      {/* Offcanvas Sidebar (Mobile only) */}
      <Offcanvas show={showSidebar} onHide={handleClose} placement="start" className="mobile-offcanvas">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {/* Profile Section for Mobile */}
          <div style={{ 
            textAlign: 'center', 
            padding: '20px 0',
            borderBottom: '1px solid #e0e0e0',
            marginBottom: '20px'
          }}>
            {user?.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt="Profile" 
                style={{ 
                  width: '70px', 
                  height: '70px', 
                  borderRadius: '50%', 
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div 
                style={{ 
                  width: '70px', 
                  height: '70px', 
                  borderRadius: '50%', 
                  backgroundColor: '#1877f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  fontSize: '28px',
                  color: 'white'
                }}
              >
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            )}
            <h6 style={{ marginTop: '10px' }}>{user?.name}</h6>
          </div>
          
          <ul style={styles.navList}>
            {navItems.map(item => (
              <li key={item.to} style={styles.navItem}>
                <NavLink
                  to={item.to}
                  onClick={handleClose}
                  style={({ isActive }) => ({
                    ...styles.navLink,
                    backgroundColor: isActive ? (theme === 'dark' ? '#0f3460' : '#e9ecef') : 'transparent',
                    color: isActive ? '#1877f2' : (theme === 'dark' ? '#eee' : '#333')
                  })}
                >
                  <span style={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main content area – with sidebar on desktop */}
      <div style={styles.layout} className="member-layout">
        {/* Desktop sidebar (visible on large screens) */}
        <aside className="desktop-sidebar" style={styles.sidebar}>
          {/* Profile Section for Desktop */}
          <div style={{ 
            textAlign: 'center', 
            padding: '20px 0',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '20px'
          }}>
            {user?.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt="Profile" 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '3px solid #1877f2'
                }}
              />
            ) : (
              <div 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  backgroundColor: '#1877f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  fontSize: '32px',
                  color: 'white'
                }}
              >
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            )}
            <h6 style={{ marginTop: '10px', color: 'var(--text-primary)' }}>{user?.name}</h6>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Member</p>
          </div>
          
          <ul style={styles.navList}>
            {navItems.map(item => (
              <li key={item.to} style={styles.navItem}>
                <NavLink
                  to={item.to}
                  style={({ isActive }) => ({
                    ...styles.navLink,
                    backgroundColor: isActive ? (theme === 'dark' ? '#0f3460' : '#e9ecef') : 'transparent',
                    color: isActive ? '#1877f2' : (theme === 'dark' ? '#eee' : '#333')
                  })}
                >
                  <span style={styles.navIcon}>{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </aside>
        <main style={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' },
  layout: { display: 'flex', flex: 1, width: '100%', maxWidth: '100%', overflowX: 'hidden' },
  sidebar: {
    width: '260px',
    padding: '20px 12px',
    borderRight: '1px solid var(--border-color)',
    height: 'calc(100vh - 60px)',
    position: 'sticky',
    top: 0,
    overflowY: 'auto',
    backgroundColor: 'transparent'
  },
  main: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    backgroundColor: 'transparent'
  },
  navList: { listStyle: 'none', padding: 0, margin: 0 },
  navItem: { marginBottom: '8px' },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'all 0.2s',
    fontSize: '16px'
  },
  navIcon: { fontSize: '20px', minWidth: '24px' }
};

export default MemberLayout;