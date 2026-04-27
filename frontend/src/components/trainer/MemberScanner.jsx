import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getAttendanceHistory, checkIn } from '../../services/attendanceService';
import { addActivityLog } from '../../services/activityLogger';
import { addNotification } from '../../services/notificationService';
import { getCurrencySymbol } from '../../utils/currency';

function MemberScanner() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [memberInfo, setMemberInfo] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('$');
  const [manualMemberId, setManualMemberId] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const scannerRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    const loadCurrency = async () => {
      const symbol = await getCurrencySymbol();
      setCurrency(symbol);
    };
    loadCurrency();
  }, []);

  useEffect(() => {
    loadRecentCheckins();
  }, [token]);

  const loadRecentCheckins = async () => {
    if (!token) return;
    try {
      const history = await getAttendanceHistory(token);
      const recent = history.slice(0, 10);
      setRecentCheckins(recent);
    } catch (error) {
      console.error('Error loading recent check-ins:', error);
    }
  };

  const startScanner = () => {
    setScanning(true);
    setScannedData(null);
    setMemberInfo(null);
    setCheckInStatus(null);
    setShowManualInput(false);

    // Dynamically import html5-qrcode to avoid SSR issues
    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      if (qrScannerRef.current) {
        qrScannerRef.current.clear();
      }
      
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          setScanning(false);
          processScannedQR(decodedText);
        },
        (error) => {
          console.warn("Scan error:", error);
        }
      );

      qrScannerRef.current = scanner;
    });
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.clear();
      qrScannerRef.current = null;
    }
    setScanning(false);
  };

  const processScannedQR = async (qrData) => {
    setLoading(true);
    try {
      // Parse QR data
      let memberData;
      try {
        memberData = JSON.parse(qrData);
      } catch (e) {
        // If not JSON, treat as user ID or email
        memberData = { userId: qrData, userId2: qrData };
      }

      setScannedData(memberData);
      
      const userId = memberData.userId2 || memberData.userId || memberData.memberId || memberData;
      
      if (!userId) {
        throw new Error('Invalid QR code: No user ID found');
      }

      await fetchMemberInfo(userId);
    } catch (error) {
      console.error('Error processing QR:', error);
      setCheckInStatus({
        error: error.message,
        canCheckIn: false
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberInfo = async (userId) => {
    try {
      // Fetch member details from backend
      const memberResponse = await fetch(`http://localhost:5000/api/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const memberResult = await memberResponse.json();
      
      if (!memberResult.success || !memberResult.user) {
        throw new Error('Member not found');
      }

      const member = memberResult.user;
      
      // Check membership status
      const membershipResponse = await fetch(`http://localhost:5000/api/memberships/active/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const membershipData = await membershipResponse.json();
      
      const isActive = membershipData.membership && 
                       new Date(membershipData.membership.endDate) > new Date();
      
      setMemberInfo({
        ...member,
        membership: membershipData.membership,
        isActive
      });

      // Check if already checked in today
      const attendanceResponse = await fetch(`http://localhost:5000/api/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const attendanceResult = await attendanceResponse.json();
      const today = new Date().toDateString();
      const alreadyCheckedIn = attendanceResult.history?.some(
        record => record.userId === userId && 
                  new Date(record.checkInTime).toDateString() === today &&
                  !record.checkOutTime
      );

      setCheckInStatus({
        alreadyCheckedIn,
        canCheckIn: isActive && !alreadyCheckedIn
      });

    } catch (error) {
      console.error('Error fetching member info:', error);
      setCheckInStatus({
        error: error.message || 'Could not fetch member information',
        canCheckIn: false
      });
    }
  };

  const handleManualLookup = async () => {
    if (!manualMemberId) {
      setCheckInStatus({ error: 'Please enter a member ID or email', canCheckIn: false });
      return;
    }
    setLoading(true);
    setCheckInStatus(null);
    await fetchMemberInfo(manualMemberId);
    setLoading(false);
  };

  const handleCheckIn = async () => {
    if (!memberInfo || !checkInStatus?.canCheckIn) return;
    
    setLoading(true);
    try {
      const result = await checkIn({
        userId: memberInfo._id,
        className: 'QR Scan Check-in',
        branchId: memberInfo.branchId
      }, token);
      
      if (result) {
        await addActivityLog(
          user?.email, 
          'Member Check-in', 
          `Checked in member: ${memberInfo.name} (${memberInfo.email})`,
          token
        );
        
        await addNotification({
          userId: memberInfo._id,
          title: 'Gym Check-in',
          message: `You checked in at ${new Date().toLocaleTimeString()}`,
          type: 'success'
        }, token);
        
        setCheckInStatus({
          ...checkInStatus,
          alreadyCheckedIn: true,
          canCheckIn: false,
          success: true
        });
        
        await loadRecentCheckins();
        
        // Reset after 3 seconds
        setTimeout(() => {
          setScannedData(null);
          setMemberInfo(null);
          setCheckInStatus(null);
        }, 3000);
      } else {
        throw new Error('Check-in failed');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      setCheckInStatus({
        ...checkInStatus,
        error: error.message || 'Check-in failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    stopScanner();
    setScannedData(null);
    setMemberInfo(null);
    setCheckInStatus(null);
    setManualMemberId('');
    setShowManualInput(false);
  };

  const styles = {
    container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    scannerSection: {
      backgroundColor: 'var(--card-bg)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginBottom: '20px'
    },
    primaryButton: {
      padding: '12px 24px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      transition: 'background-color 0.2s'
    },
    secondaryButton: {
      padding: '12px 24px',
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      transition: 'background-color 0.2s'
    },
    dangerButton: {
      padding: '12px 24px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold'
    },
    manualInputGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '16px',
      flexWrap: 'wrap'
    },
    manualInput: {
      flex: 1,
      padding: '12px',
      borderRadius: '8px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333',
      fontSize: '14px'
    },
    scannerContainer: {
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto'
    },
    infoText: {
      textAlign: 'center',
      marginTop: '16px',
      color: 'var(--text-secondary)'
    },
    memberCard: {
      backgroundColor: 'var(--card-bg)',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '20px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`
    },
    memberHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '16px',
      flexWrap: 'wrap'
    },
    avatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      backgroundColor: '#1877f2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px',
      color: 'white'
    },
    memberInfo: { flex: 1 },
    memberName: { margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' },
    memberEmail: { margin: '4px 0', color: 'var(--text-secondary)' },
    membershipStatus: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    activeStatus: { backgroundColor: '#4caf50', color: 'white' },
    inactiveStatus: { backgroundColor: '#f44336', color: 'white' },
    checkinButton: {
      padding: '12px 24px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      marginTop: '12px',
      width: '100%'
    },
    disabledButton: {
      backgroundColor: '#6c757d',
      cursor: 'not-allowed',
      opacity: 0.7
    },
    successMessage: { 
      color: '#4caf50', 
      marginTop: '12px', 
      textAlign: 'center',
      padding: '12px',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderRadius: '8px'
    },
    errorMessage: { 
      color: '#f44336', 
      marginTop: '12px', 
      textAlign: 'center',
      padding: '12px',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      borderRadius: '8px'
    },
    recentCard: {
      backgroundColor: 'var(--card-bg)',
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`
    },
    recentList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    recentItem: {
      padding: '12px',
      borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px'
    },
    badge: {
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 'bold'
    },
    successBadge: { backgroundColor: '#4caf50', color: 'white' },
    loadingOverlay: {
      textAlign: 'center',
      padding: '40px'
    },
    spinner: {
      display: 'inline-block',
      width: '40px',
      height: '40px',
      border: '3px solid rgba(0,0,0,0.1)',
      borderTopColor: '#1877f2',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  const qrReaderStyle = {
    width: '100%',
    border: `2px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`,
    borderRadius: '8px'
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📷 Member Scanner</h2>
      
      <div style={styles.scannerSection}>
        {!scanning && !scannedData && !memberInfo && (
          <div>
            <div style={styles.buttonGroup}>
              <button onClick={startScanner} style={styles.primaryButton}>
                📷 Start QR Scanner
              </button>
              <button 
                onClick={() => setShowManualInput(!showManualInput)} 
                style={styles.secondaryButton}
              >
                ⌨️ Manual Entry
              </button>
            </div>
            
            {showManualInput && (
              <div style={styles.manualInputGroup}>
                <input
                  type="text"
                  placeholder="Enter Member ID or Email"
                  value={manualMemberId}
                  onChange={(e) => setManualMemberId(e.target.value)}
                  style={styles.manualInput}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLookup()}
                />
                <button onClick={handleManualLookup} style={styles.primaryButton}>
                  Lookup
                </button>
              </div>
            )}
            
            <p style={styles.infoText}>
              Scan a member's digital membership card QR code or enter their ID/email manually
            </p>
          </div>
        )}
        
        {scanning && (
          <div>
            <div style={styles.scannerContainer}>
              <div id="qr-reader" style={qrReaderStyle}></div>
            </div>
            <div style={styles.buttonGroup}>
              <button onClick={stopScanner} style={styles.dangerButton}>
                Stop Scanning
              </button>
            </div>
          </div>
        )}
        
        {loading && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner}></div>
            <p>Loading member information...</p>
          </div>
        )}
        
        {memberInfo && !loading && (
          <div style={styles.memberCard}>
            <div style={styles.memberHeader}>
              <div style={styles.avatar}>
                {memberInfo.name?.charAt(0) || memberInfo.email?.charAt(0) || 'M'}
              </div>
              <div style={styles.memberInfo}>
                <h3 style={styles.memberName}>{memberInfo.name || 'Member'}</h3>
                <p style={styles.memberEmail}>{memberInfo.email}</p>
                <p style={styles.memberEmail}>
                  📞 {memberInfo.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <span style={{
                  ...styles.membershipStatus,
                  ...(memberInfo.isActive ? styles.activeStatus : styles.inactiveStatus)
                }}>
                  {memberInfo.isActive ? '✅ Active' : '❌ Inactive'}
                </span>
              </div>
            </div>
            
            {memberInfo.membership && (
              <div style={{ marginBottom: '16px' }}>
                <p><strong>📋 Plan:</strong> {memberInfo.membership.planName}</p>
                <p><strong>📅 Expires:</strong> {new Date(memberInfo.membership.endDate).toLocaleDateString()}</p>
              </div>
            )}
            
            {checkInStatus?.canCheckIn && (
              <button 
                onClick={handleCheckIn} 
                style={styles.checkinButton}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
              >
                ✅ Check In Member
              </button>
            )}
            
            {checkInStatus?.alreadyCheckedIn && (
              <div style={{ ...styles.checkinButton, ...styles.disabledButton, backgroundColor: '#ff9800' }}>
                ✓ Already Checked In Today
              </div>
            )}
            
            {checkInStatus?.error && (
              <div style={styles.errorMessage}>
                ❌ {checkInStatus.error}
              </div>
            )}
            
            {checkInStatus?.success && (
              <div style={styles.successMessage}>
                ✅ Check-in successful! Member has been checked in.
              </div>
            )}
            
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button onClick={handleReset} style={styles.secondaryButton}>
                Scan Another Member
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div style={styles.recentCard}>
        <h3>🕐 Recent Check-ins</h3>
        {recentCheckins.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
            No recent check-ins
          </p>
        ) : (
          <ul style={styles.recentList}>
            {recentCheckins.map((checkin, idx) => (
              <li key={idx} style={styles.recentItem}>
                <div>
                  <strong>{checkin.userName || checkin.userId}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(checkin.checkInTime).toLocaleString()}
                  </div>
                </div>
                <span style={{ ...styles.badge, ...styles.successBadge }}>
                  Checked In
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Add animation styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default MemberScanner;