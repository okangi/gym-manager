import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Navbar as BSNavbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import NotificationBell from './NotificationBell';
import Avatar from './Avatar';
import { getGymSettings } from '../../services/gymSettingsService';

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [gymSettings, setGymSettings] = useState({ name: 'Gym Manager', logo: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    
    const handleSettingsUpdate = () => {
      loadSettings();
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getGymSettings();
      setGymSettings(settings);
    } catch (error) {
      console.error('Error loading gym settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'member': return '/member/dashboard';
      case 'admin': return '/admin/dashboard';
      case 'trainer': return '/trainer/dashboard';
      default: return '/login';
    }
  };

  const getNavItems = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'member':
        return [
          { to: '/member/dashboard', label: 'Dashboard', icon: '📊' },
          { to: '/member/classes', label: 'Classes', icon: '📚' },
          { to: '/member/membership', label: 'Membership', icon: '💳' },
          { to: '/member/chat', label: 'Chat', icon: '💬' },
          { to: '/member/profile', label: 'Profile', icon: '👤' }
        ];
      case 'admin':
        return [
          { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
          { to: '/admin/users', label: 'Users', icon: '👥' },
          { to: '/admin/plans', label: 'Plans', icon: '📋' },
          { to: '/admin/branches', label: 'Branches', icon: '🏢' },
          { to: '/admin/trainers', label: 'Trainers', icon: '🏋️' },
          { to: '/admin/classes', label: 'Classes', icon: '📚' },
          { to: '/admin/payments', label: 'Payments', icon: '💰' }
        ];
      case 'trainer':
        return [
          { to: '/trainer/dashboard', label: 'Dashboard', icon: '📊' },
          { to: '/trainer/classes', label: 'Classes', icon: '📚' },
          { to: '/trainer/bookings', label: 'Bookings', icon: '📅' },
          { to: '/trainer/chat', label: 'Chat', icon: '💬' },
          { to: '/trainer/profile', label: 'Profile', icon: '👤' }
        ];
      default:
        return [];
    }
  };

  const brandStyle = {
    display: 'flex',
    alignItems: 'center',
    color: theme === 'dark' ? '#fff' : '#000',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '1.2rem'
  };

  const linkStyle = {
    color: theme === 'dark' ? '#f8f9fa' : '#212529',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  const dashboardLink = getDashboardLink();
  const navItems = getNavItems();

  // Show minimal navbar while loading
  if (loading) {
    return (
      <BSNavbar bg={theme === 'light' ? 'light' : 'dark'} variant={theme === 'light' ? 'light' : 'dark'} expand="lg">
        <Container>
          <Link to={dashboardLink} style={brandStyle}>
            {gymSettings.name}
          </Link>
        </Container>
      </BSNavbar>
    );
  }

  return (
    <BSNavbar bg={theme === 'light' ? 'light' : 'dark'} variant={theme === 'light' ? 'light' : 'dark'} expand="lg" sticky="top">
      <Container fluid>
        <Link to={dashboardLink} style={brandStyle}>
          {gymSettings.logo && (
            <img 
              src={gymSettings.logo} 
              alt="Logo" 
              style={{ height: '35px', marginRight: '10px', objectFit: 'contain' }} 
            />
          )}
          {gymSettings.name}
        </Link>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {navItems.map((item) => (
              <Nav.Link 
                key={item.to} 
                as={Link} 
                to={item.to} 
                style={linkStyle}
                active={window.location.pathname === item.to}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Nav.Link>
            ))}
          </Nav>
          
          <Nav className="align-items-center">
            <NotificationBell />
            
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={toggleTheme} 
              style={{ 
                width: 'auto', 
                margin: '0 8px',
                color: theme === 'dark' ? '#ccc' : '#333',
                borderColor: theme === 'dark' ? '#555' : '#ccc',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </Button>
            
            {/* User Dropdown */}
            {user && (
              <Dropdown align="end">
                <Dropdown.Toggle 
                  as="div" 
                  style={{ 
                    cursor: 'pointer',
                    padding: 0,
                    background: 'none',
                    border: 'none'
                  }}
                >
                  <Avatar size={36} border={true} />
                </Dropdown.Toggle>
                
                <Dropdown.Menu style={{ 
                  backgroundColor: theme === 'dark' ? '#1e2a3a' : '#fff',
                  borderColor: theme === 'dark' ? '#444' : '#ddd'
                }}>
                  <Dropdown.ItemText style={{ color: theme === 'dark' ? '#eee' : '#333' }}>
                    <strong>{user.name || user.email}</strong>
                    <br />
                    <small style={{ color: theme === 'dark' ? '#aaa' : '#666' }}>
                      {user.role === 'admin' ? 'Administrator' : user.role === 'trainer' ? 'Trainer' : 'Member'}
                    </small>
                  </Dropdown.ItemText>
                  <Dropdown.Divider />
                  <Dropdown.Item 
                    as={Link} 
                    to={dashboardLink}
                    style={{ color: theme === 'dark' ? '#eee' : '#333' }}
                  >
                    📊 Dashboard
                  </Dropdown.Item>
                  <Dropdown.Item 
                    as={Link} 
                    to={`/${user.role}/profile`}
                    style={{ color: theme === 'dark' ? '#eee' : '#333' }}
                  >
                    👤 Profile
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item 
                    onClick={handleLogout}
                    style={{ color: '#dc3545' }}
                  >
                    🚪 Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
            
            {!user && (
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => navigate('/login')}
                style={{ marginLeft: '8px' }}
              >
                Login
              </Button>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
}

export default Navbar;