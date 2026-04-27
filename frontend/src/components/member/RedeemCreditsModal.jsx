import { useState } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { redeemCredits } from '../../services/userService';
import { addActivityLog } from '../../services/activityLogger';
import { addNotification } from '../../services/notificationService';
import { getCurrencySymbol } from '../../utils/currency';

function RedeemCreditsModal({ show, onHide, currentCredits, onRedeem }) {
  const { user, token, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [amount, setAmount] = useState(1);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('$');

  // Load currency symbol
  useState(() => {
    const loadCurrency = async () => {
      const symbol = await getCurrencySymbol();
      setCurrency(symbol);
    };
    loadCurrency();
  }, []);

  const getDiscountValue = () => {
    // 1 credit = 1 currency unit discount
    return amount;
  };

  const validateAmount = () => {
    if (amount < 1) {
      setMessage('Please enter at least 1 credit');
      setMessageType('error');
      return false;
    }
    if (amount > currentCredits) {
      setMessage(`You only have ${currentCredits} credits available`);
      setMessageType('error');
      return false;
    }
    return true;
  };

  const handleRedeem = async () => {
    if (!validateAmount()) {
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
      return;
    }
    
    setLoading(true);
    setMessage('');
    setMessageType('');
    
    try {
      const result = await redeemCredits(user.id, amount, token);
      
      if (result.success) {
        // Log activity
        await addActivityLog(
          user?.email, 
          'Redeem Credits', 
          `Redeemed ${amount} credits for ${currency}${getDiscountValue()} discount`, 
          token
        );
        
        // Send notification
        await addNotification({
          userId: user.id,
          title: 'Credits Redeemed',
          message: `You redeemed ${amount} credits for ${currency}${getDiscountValue()} discount. It will be applied to your next membership purchase.`,
          type: 'success'
        }, token);
        
        setMessage(`✅ Successfully redeemed ${amount} credits for ${currency}${getDiscountValue()} discount!`);
        setMessageType('success');
        
        // Store the redeemed amount in localStorage as a fallback
        localStorage.setItem('gym_redeemed_discount', amount.toString());
        
        // Update AuthContext to reflect new credit balance
        await refreshUser();
        
        // Wait a moment then close modal and refresh parent
        setTimeout(() => {
          if (onRedeem) onRedeem(); // refresh credits in parent (ReferralInfo)
          // Dispatch custom event with the redeemed amount
          window.dispatchEvent(new CustomEvent('creditsRedeemed', { detail: { amount, discount: getDiscountValue() } }));
          onHide();
          setAmount(1);
        }, 2000);
      } else {
        setMessage(`❌ Redemption failed: ${result.message || 'Please try again.'}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error redeeming credits:', error);
      setMessage('❌ Redemption failed. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getMaxRedeemable = () => {
    // Optional: Set a maximum redeem limit (e.g., 50 credits per transaction)
    const maxPerTransaction = 50;
    return Math.min(currentCredits, maxPerTransaction);
  };

  const handleAmountChange = (value) => {
    const newAmount = parseInt(value) || 0;
    const maxAmount = getMaxRedeemable();
    if (newAmount > maxAmount) {
      setMessage(`Maximum ${maxAmount} credits per transaction`);
      setMessageType('warning');
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 2000);
      setAmount(maxAmount);
    } else {
      setAmount(Math.min(newAmount, currentCredits));
      setMessage('');
      setMessageType('');
    }
  };

  const styles = {
    modalContent: {
      backgroundColor: 'var(--card-bg)',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    text: { color: 'var(--text-secondary)' },
    creditsValue: { 
      fontSize: '1.5rem', 
      fontWeight: 'bold', 
      color: '#1877f2' 
    },
    discountPreview: {
      marginTop: '12px',
      padding: '12px',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#f0f7ff',
      borderRadius: '8px',
      textAlign: 'center'
    },
    successMessage: { 
      color: '#4caf50', 
      marginTop: '8px',
      padding: '8px',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderRadius: '4px'
    },
    errorMessage: { 
      color: '#f44336', 
      marginTop: '8px',
      padding: '8px',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      borderRadius: '4px'
    },
    warningMessage: {
      color: '#ff9800',
      marginTop: '8px',
      padding: '8px',
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      borderRadius: '4px'
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton style={{ 
        backgroundColor: 'var(--card-bg)', 
        borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}` 
      }}>
        <Modal.Title style={{ color: 'var(--text-primary)' }}>
          🎁 Redeem Referral Credits
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={styles.modalContent}>
        <p style={styles.text}>
          You have <span style={styles.creditsValue}>{currentCredits}</span> credits available
        </p>
        
        <p style={styles.text}>
          💰 <strong>Value:</strong> {currentCredits} credit(s) = {currency}{currentCredits} discount
        </p>
        
        <Form.Group className="mb-3">
          <Form.Label style={{ color: theme === 'dark' ? '#eee' : '#333' }}>
            Credits to redeem:
          </Form.Label>
          <Form.Control
            type="number"
            min={1}
            max={getMaxRedeemable()}
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            style={{ 
              backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', 
              color: theme === 'dark' ? '#eee' : '#333', 
              borderColor: theme === 'dark' ? '#555' : '#ccc' 
            }}
            disabled={loading}
          />
          <Form.Text className="text-muted">
            {currentCredits > 0 
              ? `You can redeem up to ${getMaxRedeemable()} credits` 
              : 'No credits available to redeem'}
          </Form.Text>
        </Form.Group>
        
        {amount > 0 && amount <= currentCredits && (
          <div style={styles.discountPreview}>
            <strong>🎉 Discount Preview</strong>
            <div style={{ fontSize: '1.2rem', marginTop: '8px' }}>
              You will get <strong style={{ color: '#4caf50' }}>{currency}{getDiscountValue()}</strong> OFF
            </div>
            <div style={{ fontSize: '11px', marginTop: '8px', color: 'var(--text-secondary)' }}>
              Discount will be applied automatically at checkout
            </div>
          </div>
        )}
        
        {message && (
          <div className="mt-2" style={
            messageType === 'success' ? styles.successMessage :
            messageType === 'error' ? styles.errorMessage :
            messageType === 'warning' ? styles.warningMessage : {}
          }>
            {message}
          </div>
        )}
      </Modal.Body>
      
      <Modal.Footer style={{ 
        backgroundColor: 'var(--card-bg)', 
        borderTop: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}` 
      }}>
        <Button 
          variant="secondary" 
          onClick={onHide} 
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleRedeem} 
          disabled={loading || amount < 1 || amount > currentCredits}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            `Redeem ${amount} Credit${amount !== 1 ? 's' : ''}`
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default RedeemCreditsModal;