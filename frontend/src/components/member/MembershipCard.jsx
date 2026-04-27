import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { getBranches } from '../../services/branchService';
import { getActiveMembership } from '../../services/membershipService';

function MembershipCard() {
  const { user, token } = useAuth(); // Added token
  const { theme } = useTheme();
  const canvasRef = useRef(null);
  const [branchName, setBranchName] = useState('');
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id && !user?._id) {
        setLoading(false);
        return;
      }
      
      try {
        // Load membership info
        const activeMembership = await getActiveMembership(user.id || user._id, token);
        setMembership(activeMembership);
        
        // Load branch name
        if (user?.branchId) {
          const branches = await getBranches();
          const branch = branches.find(b => (b.id || b._id) === user.branchId);
          if (branch) setBranchName(branch.name);
        }
      } catch (error) {
        console.error('Error loading membership data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, token]);

  // Encode user info including membership data for scanner
  const qrData = JSON.stringify({
    userId: user?.email,
    userId2: user?.id || user?._id,
    name: user?.name,
    role: user?.role,
    branchId: user?.branchId,
    branchName: branchName,
    memberId: user?.id || user?._id,
    membershipStatus: membership ? 'active' : 'inactive',
    membershipPlan: membership?.planName || null,
    membershipExpiry: membership?.endDate || null
  });

  useEffect(() => {
    if (canvasRef.current && user?.email) {
      QRCode.toCanvas(canvasRef.current, qrData, { width: 200, margin: 2 }, (error) => {
        if (error) console.error('QR Code generation error:', error);
      });
    }
  }, [qrData, user?.email]);

  const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '20px' },
    card: {
      backgroundColor: 'var(--card-bg)',
      borderRadius: '16px',
      padding: '24px',
      textAlign: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      maxWidth: '400px',
      width: '100%',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`
    },
    title: { color: 'var(--text-primary)', marginBottom: '16px' },
    memberName: { color: theme === 'dark' ? '#eee' : '#333', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' },
    memberEmail: { color: theme === 'dark' ? '#ccc' : '#666', marginBottom: '8px' },
    memberBranch: { color: theme === 'dark' ? '#ccc' : '#666', marginBottom: '8px', fontSize: '14px' },
    membershipStatus: { 
      backgroundColor: membership ? '#4caf50' : '#f44336', 
      color: 'white', 
      padding: '4px 12px', 
      borderRadius: '20px', 
      display: 'inline-block',
      fontSize: '12px',
      marginBottom: '12px'
    },
    membershipPlan: { color: theme === 'dark' ? '#fff' : '#1877f2', fontWeight: 'bold', marginBottom: '8px' },
    membershipExpiry: { color: theme === 'dark' ? '#ccc' : '#666', fontSize: '12px', marginBottom: '16px' },
    instruction: { color: theme === 'dark' ? '#aaa' : '#888', fontSize: '12px', marginTop: '16px' },
    loading: { textAlign: 'center', padding: '20px', color: theme === 'dark' ? '#aaa' : '#666' },
    renewButton: {
      marginTop: '16px',
      padding: '8px 16px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px'
    }
  };

  const daysLeft = membership ? Math.ceil((new Date(membership.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loading}>Loading membership card...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Digital Membership Card</h2>
        <canvas ref={canvasRef} style={{ margin: '0 auto', display: 'block' }} />
        
        <div style={styles.memberName}>{user?.name || user?.email}</div>
        <div style={styles.memberEmail}>{user?.email}</div>
        {branchName && <div style={styles.memberBranch}>🏢 Branch: {branchName}</div>}
        
        {membership ? (
          <>
            <div style={styles.membershipStatus}>✅ Active Membership</div>
            <div style={styles.membershipPlan}>📋 {membership.planName}</div>
            <div style={styles.membershipExpiry}>
              Expires: {new Date(membership.endDate).toLocaleDateString()}
              {daysLeft <= 7 && daysLeft > 0 && (
                <span style={{ color: '#ff9800', display: 'block', marginTop: '4px' }}>
                  ⚠️ {daysLeft} days remaining
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={styles.membershipStatus}>❌ No Active Membership</div>
            <button 
              onClick={() => window.location.href = '/member/membership'} 
              style={styles.renewButton}
            >
              Join a Plan
            </button>
          </>
        )}
        
        <div style={styles.instruction}>
          Show this QR code at the gym entrance for check‑in.
        </div>
      </div>
    </div>
  );
}

export default MembershipCard;