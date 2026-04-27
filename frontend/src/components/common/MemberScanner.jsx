import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getActiveMembership } from '../../services/membershipService';
import { addNotification } from '../../services/notificationService';
import { getUsers } from '../../services/userService';
import { checkIn as attendanceCheckIn } from '../../services/attendanceService';

function MemberScanner() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [scanResult, setScanResult] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [error, setError] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [loading, setLoading] = useState(false);

  // Inject CSS to make scanner UI readable in dark mode
  useEffect(() => {
    if (theme === 'dark') {
      const style = document.createElement('style');
      style.textContent = `
        #reader {
          color: #eee !important;
        }
        #reader input[type="file"] {
          color: #eee !important;
          background-color: #1e2a3a !important;
          border: 1px solid #555 !important;
          padding: 6px !important;
          border-radius: 4px !important;
          margin-top: 8px !important;
        }
        #reader button, #reader .btn {
          color: white !important;
          background-color: #1877f2 !important;
        }
        #reader a, #reader .link {
          color: #4caf50 !important;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [theme]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    const onSuccess = (decodedText) => {
      setScanResult(decodedText);
      scanner.clear();
      let email = decodedText;
      try {
        const data = JSON.parse(decodedText);
        email = data.userId || email;
      } catch {
        // not JSON, treat as email directly
      }
      lookupMember(email);
    };

    const onError = (err) => {
      console.error(err);
    };

    scanner.render(onSuccess, onError);

    return () => {
      scanner.clear();
    };
  }, []);

  const lookupMember = async (email) => {
    setLoading(true);
    setError('');
    setMemberInfo(null);
    
    try {
      // Get user from backend
      const allUsers = await getUsers(token);
      let member = allUsers.find(u => u.email === email && u.role === 'member');
      
      if (!member) {
        setError('Member not found');
        setLoading(false);
        return;
      }

      // Branch restriction: trainers can only see members of their own branch
      if (user?.role === 'trainer' && member.branchId !== user.branchId) {
        setError('You are not authorized to view members from other branches.');
        setLoading(false);
        return;
      }

      // Get active membership
      const membership = await getActiveMembership(member.id || member._id, token);
      
      setMemberInfo({ member, membership });
    } catch (err) {
      console.error('Error looking up member:', err);
      setError('Error looking up member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!memberInfo || !memberInfo.membership) {
      alert('Cannot check in: no active membership');
      return;
    }
    
    setCheckingIn(true);
    
    try {
      const checkInData = {
        branchId: memberInfo.member.branchId,
        branchName: memberInfo.member.branchName,
        checkInMethod: 'QR Code'
      };
      
      const result = await attendanceCheckIn(checkInData, token);
      
      if (result && result.success !== false) {
        // Send notification to member
        await addNotification(
          { 
            userId: memberInfo.member.id || memberInfo.member._id,
            title: 'Check-in Recorded',
            message: `You were checked in by ${user?.name || user?.email} at ${new Date().toLocaleTimeString()}.`,
            type: 'info'
          }, 
          token
        );
        
        alert('Check-in recorded successfully!');
        
        // Refresh member info to show updated attendance
        await lookupMember(memberInfo.member.email);
      } else {
        alert('Failed to record check-in. Please try again.');
      }
    } catch (err) {
      console.error('Error checking in:', err);
      alert('Error recording check-in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    reader: { width: '100%', maxWidth: '500px', margin: '0 auto' },
    resultCard: {
      marginTop: '20px',
      padding: '16px',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '8px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`,
      color: theme === 'dark' ? '#eee' : '#333'
    },
    statusActive: { color: '#4caf50', fontWeight: 'bold' },
    statusInactive: { color: '#f44336', fontWeight: 'bold' },
    errorText: { color: '#f44336', marginTop: '16px' },
    successText: { color: '#4caf50', marginTop: '16px' },
    checkinButton: {
      marginTop: '12px',
      padding: '8px 16px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      opacity: checkingIn ? 0.7 : 1
    },
    instruction: {
      fontSize: '14px',
      marginBottom: '12px',
      color: 'var(--text-secondary)'
    },
    loading: {
      textAlign: 'center',
      padding: '20px',
      color: 'var(--text-secondary)'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Scan Member QR Code</h2>
        <div style={styles.loading}>Looking up member...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Scan Member QR Code</h2>
      <p style={styles.instruction}>Point camera at the member's digital membership card QR code.</p>
      <div id="reader" style={styles.reader}></div>
      {error && <p style={styles.errorText}>{error}</p>}
      {memberInfo && (
        <div style={styles.resultCard}>
          <h3>Member Details</h3>
          <p><strong>Name:</strong> {memberInfo.member.name || memberInfo.member.email}</p>
          <p><strong>Email:</strong> {memberInfo.member.email}</p>
          <p><strong>Phone:</strong> {memberInfo.member.phone || 'Not provided'}</p>
          <p><strong>Membership Status:</strong> {memberInfo.membership ? (
            <span style={styles.statusActive}>ACTIVE</span>
          ) : (
            <span style={styles.statusInactive}>INACTIVE / EXPIRED</span>
          )}</p>
          {memberInfo.membership && (
            <>
              <p><strong>Plan:</strong> {memberInfo.membership.planName}</p>
              <p><strong>Expires:</strong> {new Date(memberInfo.membership.endDate).toLocaleDateString()}</p>
              <button 
                onClick={handleCheckIn} 
                disabled={checkingIn} 
                style={styles.checkinButton}
              >
                {checkingIn ? 'Checking in...' : 'Record Check-in'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default MemberScanner;