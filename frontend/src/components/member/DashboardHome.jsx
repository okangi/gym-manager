import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Statistics from '../common/Statistics';
import ActivityLog from '../common/ActivityLog';
import { getActiveMembership } from '../../services/membershipService';
import AttendanceCalendar from './AttendanceCalendar';
import ReferralInfo from './ReferralInfo';

function DashboardHome() {
  const { user, token, refreshUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMembership = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('Fetching membership from backend API...');
      // ALWAYS fetch from backend - this is the source of truth
      const active = await getActiveMembership(user?.id || user?._id, token);
      console.log('Membership from backend:', active);
      setMembership(active);
    } catch (error) {
      console.error('Error loading membership:', error);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  };

  // Check for refresh from navigation state
  useEffect(() => {
    if (location.state?.refreshed) {
      console.log('Refresh triggered by navigation state');
      loadMembership();
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Initial load
  useEffect(() => {
    loadMembership();
  }, [token, user?.id, user?._id]);

  // Listen for membership updates
  useEffect(() => {
    const handleMembershipUpdate = () => {
      console.log('Membership update event received, reloading...');
      loadMembership();
    };
    
    window.addEventListener('membershipUpdated', handleMembershipUpdate);
    window.addEventListener('userUpdated', handleMembershipUpdate);
    
    return () => {
      window.removeEventListener('membershipUpdated', handleMembershipUpdate);
      window.removeEventListener('userUpdated', handleMembershipUpdate);
    };
  }, [token]);

  const styles = {
    title: { color: 'var(--text-primary)', marginBottom: '24px' },
    membershipCard: {
      backgroundColor: 'var(--card-bg)',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '24px',
      borderLeft: `4px solid ${membership ? '#4caf50' : '#f44336'}`
    },
    membershipTitle: { color: theme === 'dark' ? '#fff' : '#1877f2', marginBottom: '8px' },
    membershipText: { color: 'var(--text-secondary)', marginBottom: '4px' },
    renewLink: { color: '#1877f2', textDecoration: 'none', cursor: 'pointer' },
    avatar: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      objectFit: 'cover',
      marginRight: '15px'
    },
    welcomeCard: {
      backgroundColor: 'var(--card-bg)',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      border: `1px solid ${theme === 'dark' ? '#333' : '#e0e0e0'}`
    },
    loadingText: {
      textAlign: 'center',
      padding: '20px',
      color: 'var(--text-secondary)'
    }
  };

  const daysLeft = membership ? Math.ceil((new Date(membership.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  if (loading) {
    return (
      <div>
        <div style={styles.welcomeCard}>
          <div style={styles.avatar}>
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" style={styles.avatar} />
            ) : (
              <div style={{ ...styles.avatar, backgroundColor: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px' }}>
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
              Welcome back, {user?.name?.split(' ')[0] || user?.name}!
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>
              {user?.role === 'admin' ? 'Administrator' : user?.role === 'trainer' ? 'Fitness Trainer' : 'Member'}
            </p>
          </div>
        </div>
        <div style={styles.loadingText}>Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.welcomeCard}>
        {user?.profilePicture ? (
          <img src={user.profilePicture} alt="Profile" style={styles.avatar} />
        ) : (
          <div style={{ ...styles.avatar, backgroundColor: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px' }}>
            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
        )}
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
            Welcome back, {user?.name?.split(' ')[0] || user?.name}!
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>
            {user?.role === 'admin' ? 'Administrator' : user?.role === 'trainer' ? 'Fitness Trainer' : 'Member'}
          </p>
        </div>
      </div>
      
      {membership ? (
        <div style={styles.membershipCard}>
          <h3 style={styles.membershipTitle}>✅ Active Membership</h3>
          <p style={styles.membershipText}>Plan: <strong>{membership.planName}</strong></p>
          <p style={styles.membershipText}>Start Date: {new Date(membership.startDate).toLocaleDateString()}</p>
          <p style={styles.membershipText}>Expires: {new Date(membership.endDate).toLocaleDateString()}</p>
          <p style={styles.membershipText}>Status: Active ✅</p>
          {daysLeft <= 7 && daysLeft > 0 && (
            <p style={{ color: '#ff9800', marginTop: '8px' }}>⚠️ Your membership expires in {daysLeft} days. Renew soon!</p>
          )}
          <button onClick={() => navigate('/member/membership')} style={styles.renewLink}>
            View Plans →
          </button>
        </div>
      ) : (
        <div style={styles.membershipCard}>
          <p style={styles.membershipText}>❌ You don't have an active membership.</p>
          <button onClick={() => navigate('/member/membership')} style={styles.renewLink}>
            Join a Plan Now →
          </button>
        </div>
      )}
      
      <ReferralInfo />
      <AttendanceCalendar userEmail={user?.email} />
      <Statistics currentUser={user} />
      <ActivityLog currentUser={user} />
    </div>
  );
}

export default DashboardHome;