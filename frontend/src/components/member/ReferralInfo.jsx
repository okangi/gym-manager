import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { addNotification } from '../../services/notificationService';
import { getUserCredits } from '../../services/userService';
import { getCurrencySymbol } from '../../utils/currency';
import RedeemCreditsModal from './RedeemCreditsModal';
import { Spinner } from 'react-bootstrap';

function ReferralInfo() {
  const { user, token, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [credits, setCredits] = useState(user?.referralCredits || 0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currency, setCurrency] = useState('$');

  // Load currency symbol
  useEffect(() => {
    const loadCurrency = async () => {
      const symbol = await getCurrencySymbol();
      setCurrency(symbol);
    };
    loadCurrency();
  }, []);

  const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      
      await addNotification({
        userId: user?.id,
        title: 'Link Copied',
        message: 'Referral link copied to clipboard! Share it with your friends.',
        type: 'success'
      }, token);
      
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy link. Please copy manually.');
    }
  };

  const loadCredits = async () => {
    if (!token || !user?.id) return;
    setLoading(true);
    try {
      const result = await getUserCredits(user.id, token);
      const newCredits = result.credits || 0;
      setCredits(newCredits);
    } catch (error) {
      console.error('Error loading credits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load credits when component mounts or user changes
  useEffect(() => {
    loadCredits();
  }, [user?.id, token]);

  // Listen for the creditsRedeemed event to update the display instantly
  useEffect(() => {
    const handleCreditsRedeemed = async (event) => {
      console.log('Credits redeemed event received:', event.detail);
      await loadCredits();
      await refreshUser();
    };
    
    window.addEventListener('creditsRedeemed', handleCreditsRedeemed);
    return () => window.removeEventListener('creditsRedeemed', handleCreditsRedeemed);
  }, [user?.id, token]);

  // Listen for user updates
  useEffect(() => {
    const handleUserUpdate = () => {
      loadCredits();
    };
    
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  const styles = {
    container: {
      backgroundColor: 'var(--card-bg)',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '24px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`
    },
    title: { color: 'var(--text-primary)', marginBottom: '12px' },
    codeWrapper: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '12px'
    },
    code: {
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#f0f0f0',
      padding: '8px 12px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '18px',
      fontWeight: 'bold',
      color: theme === 'dark' ? '#eee' : '#333',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
    },
    button: {
      padding: '8px 16px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    buttonCopied: {
      backgroundColor: '#4caf50'
    },
    credits: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#4caf50',
      marginTop: '8px'
    },
    text: { color: 'var(--text-secondary)', marginBottom: '8px' },
    redeemButton: {
      marginTop: '12px',
      padding: '10px 20px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'background-color 0.2s'
    },
    loadingText: {
      color: theme === 'dark' ? '#aaa' : '#666',
      fontSize: '14px'
    },
    linkDisplay: {
      wordBreak: 'break-all',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#f0f0f0',
      padding: '8px',
      borderRadius: '4px',
      marginTop: '4px',
      marginBottom: '12px',
      fontSize: '12px',
      color: theme === 'dark' ? '#ccc' : '#666'
    },
    italicText: {
      marginTop: '12px',
      fontStyle: 'italic',
      color: theme === 'dark' ? '#aaa' : '#666',
      fontSize: '12px'
    },
    benefitText: {
      marginTop: '8px',
      fontSize: '12px',
      color: theme === 'dark' ? '#bbb' : '#555'
    },
    divider: {
      height: '1px',
      backgroundColor: theme === 'dark' ? '#333' : '#e0e0e0',
      margin: '16px 0'
    },
    flexRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  };

  const discountValue = credits; // 1 credit = 1 currency unit

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🎁 Invite Friends, Earn Rewards!</h3>
      
      <div style={styles.codeWrapper}>
        <span style={styles.code}>{user?.referralCode || 'Loading...'}</span>
        <button 
          onClick={copyToClipboard} 
          style={{
            ...styles.button,
            ...(copied ? styles.buttonCopied : {})
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#145fbf'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = copied ? '#4caf50' : '#1877f2'}
        >
          {copied ? '✓ Copied!' : '📋 Copy Link'}
        </button>
      </div>
      
      <p style={styles.text}>Share this link with friends:</p>
      <div style={styles.linkDisplay}>{referralLink}</div>
      
      <div style={styles.divider} />
      
      <div style={styles.flexRow}>
        <div>
          <p style={styles.text}>
            <strong>💰 Your Rewards</strong>
          </p>
          <div style={styles.credits}>
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <span>{credits} credit{credits !== 1 ? 's' : ''}</span>
            )}
          </div>
          {credits > 0 && (
            <p style={styles.benefitText}>
              🎉 Value: {currency}{discountValue} OFF on your next membership
            </p>
          )}
        </div>
        
        {credits > 0 && (
          <button 
            onClick={() => setShowRedeemModal(true)} 
            style={styles.redeemButton}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
          >
            🎁 Redeem Credits
          </button>
        )}
      </div>
      
      {credits === 0 && !loading && (
        <>
          <p style={styles.italicText}>
            💡 Invite friends to earn credits toward membership discounts!
          </p>
          <p style={styles.benefitText}>
            ✨ For each friend who signs up and joins a membership plan, you earn 1 credit ({currency}1 OFF).
          </p>
        </>
      )}
      
      <RedeemCreditsModal
        show={showRedeemModal}
        onHide={() => setShowRedeemModal(false)}
        currentCredits={credits}
        onRedeem={loadCredits}
      />
    </div>
  );
}

export default ReferralInfo;