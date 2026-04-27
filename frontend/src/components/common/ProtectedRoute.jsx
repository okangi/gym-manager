import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Spinner } from 'react-bootstrap';

function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Role-based dashboard mapping
  const getRoleDashboard = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'trainer':
        return '/trainer/dashboard';
      case 'member':
        return '/member/dashboard';
      default:
        return '/login';
    }
  };

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        marginTop: '50px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh'
      }}>
        <Spinner animation="border" variant="primary" />
        <p style={{ marginTop: '16px', color: isDark ? '#aaa' : '#666' }}>
          Loading...
        </p>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user?.role || !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on actual role
      const redirectPath = getRoleDashboard(user?.role);
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <Outlet />;
}

export default ProtectedRoute;