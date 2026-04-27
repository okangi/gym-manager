import { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Tabs, Tab, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { createPayment } from '../../services/paymentService';
import { addActivityLog } from '../../services/activityLogger';
import { updateUser } from '../../services/userService';
import { getCurrencySymbol } from '../../utils/currency';

function PaymentModal({ show, onHide, plan, actionType, onSuccess, redeemedDiscount = 0 }) {
  const { user, token, refreshUser } = useAuth();
  const [currency, setCurrency] = useState('$');
  const [currencyLoading, setCurrencyLoading] = useState(true);
  
  if (!plan) return null;

  const effectiveDiscount = redeemedDiscount > 0 ? redeemedDiscount : 0;
  const finalPrice = Math.max(0, plan.price - effectiveDiscount);

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load currency symbol
  useEffect(() => {
    const loadCurrency = async () => {
      const symbol = await getCurrencySymbol();
      setCurrency(symbol);
      setCurrencyLoading(false);
    };
    loadCurrency();
    
    // Listen for settings updates
    const handleSettingsUpdate = async () => {
      const symbol = await getCurrencySymbol();
      setCurrency(symbol);
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  const mapPaymentMethod = (method) => {
    switch(method) {
      case 'card':
        return 'Card';
      case 'mpesa':
        return 'Mpesa';
      case 'airtel':
        return 'Bank Transfer';
      default:
        return 'Card';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (paymentMethod === 'card') {
      if (!cardNumber || !expiry || !cvv) {
        setError('Please fill all card details');
        return;
      }
      if (cardNumber.replace(/\s/g, '').length < 15) {
        setError('Please enter a valid card number');
        return;
      }
      if (cvv.length < 3) {
        setError('Please enter a valid CVV');
        return;
      }
    } else if (paymentMethod === 'mpesa' || paymentMethod === 'airtel') {
      if (!phoneNumber || phoneNumber.length < 10) {
        setError('Please enter a valid phone number (10+ digits)');
        return;
      }
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      // Create payment record with ALL required fields for the backend schema
      const paymentData = {
        amount: finalPrice,
        planId: plan.id || plan._id,
        planName: plan.name,
        userId: user.id || user._id,
        userEmail: user.email,                    // Required by Payment model
        userName: user.name || user.email,        // Required by Payment model
        paymentMethod: mapPaymentMethod(paymentMethod), // Must match enum: Cash, Card, Mpesa, Bank Transfer, PayPal
        status: 'Completed',                      // Must match enum: Pending, Completed, Failed, Refunded
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentDate: new Date(),
        notes: `${actionType === 'join' ? 'New' : 'Upgrade'} membership - ${plan.name} - ${plan.durationDays} days`,
        type: actionType === 'join' ? 'membership_join' : 'membership_upgrade'
      };
      
      console.log('Submitting payment:', paymentData);
      
      const payment = await createPayment(paymentData, token);
      
      if (payment) {
        // Update user's membership info
        const userUpdateData = {
          currentPlanId: plan.id || plan._id,
          currentPlanName: plan.name,
          membershipStartDate: new Date().toISOString(),
          membershipEndDate: new Date(Date.now() + (plan.durationDays * 24 * 60 * 60 * 1000)).toISOString(),
          isMember: true
        };
        
        await updateUser(user.id || user._id, userUpdateData, token);
        await refreshUser();
        
        // Log activity
        await addActivityLog(
          user?.email, 
          'Payment Create', 
          `${actionType === 'join' ? 'Joined' : 'Upgraded to'} ${plan.name} plan - ${currency}${finalPrice}`,
          token
        );
        
        setSuccess(`✅ Payment successful! Your ${plan.name} membership is now active.`);
        
        // Clear form
        setCardNumber('');
        setExpiry('');
        setCvv('');
        setPhoneNumber('');
        
        // Call onSuccess callback after a delay
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(payment);
          }
          onHide();
        }, 2000);
      } else {
        setError('❌ Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || '❌ Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentLabel = () => {
    if (paymentMethod === 'mpesa') return 'M-Pesa';
    if (paymentMethod === 'airtel') return 'Airtel Money';
    return 'Card';
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '');
    }
    return v;
  };

  if (currencyLoading) {
    return (
      <Modal show={show} onHide={onHide} centered size="lg">
        <Modal.Body style={{ textAlign: 'center', padding: '40px' }}>
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading...</p>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {actionType === 'join' ? 'Join Membership' : 'Upgrade Membership'} - {plan.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3 p-3 bg-light rounded">
          <p className="mb-1"><strong>Original price:</strong> {currency}{plan.price}</p>
          {effectiveDiscount > 0 && (
            <p className="mb-1"><strong style={{ color: '#4caf50' }}>Referral discount:</strong> -{currency}{Math.min(effectiveDiscount, plan.price)}</p>
          )}
          <p className="mb-0"><strong>Final amount to pay:</strong> <span style={{ fontSize: '1.2rem', color: '#1877f2' }}>{currency}{finalPrice}</span></p>
          <p className="mb-0 text-muted small"><strong>Duration:</strong> {plan.durationDays} days</p>
        </div>

        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        {success && <Alert variant="success" className="mb-3">{success}</Alert>}

        <Tabs activeKey={paymentMethod} onSelect={(k) => setPaymentMethod(k)} className="mb-3">
          <Tab eventKey="card" title="💳 Card">
            <Form.Group className="mb-3">
              <Form.Label>Card Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="4111 1111 1111 1111"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                disabled={processing}
                maxLength={19}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Expiry (MM/YY)</Form.Label>
              <Form.Control
                type="text"
                placeholder="12/25"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                disabled={processing}
                maxLength={5}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>CVV</Form.Label>
              <Form.Control
                type="password"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                disabled={processing}
                maxLength={4}
              />
            </Form.Group>
          </Tab>

          <Tab eventKey="mpesa" title="📱 M-Pesa">
            <Form.Group className="mb-3">
              <Form.Label>M-Pesa Phone Number</Form.Label>
              <Form.Control
                type="tel"
                placeholder="0712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                disabled={processing}
              />
              <Form.Text className="text-muted">
                You will receive a prompt on your phone to complete payment.
              </Form.Text>
            </Form.Group>
          </Tab>

          <Tab eventKey="airtel" title="📱 Airtel Money">
            <Form.Group className="mb-3">
              <Form.Label>Airtel Money Phone Number</Form.Label>
              <Form.Control
                type="tel"
                placeholder="0712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                disabled={processing}
              />
              <Form.Text className="text-muted">
                You will receive a prompt on your phone to complete payment.
              </Form.Text>
            </Form.Group>
          </Tab>
        </Tabs>

        <Button
          type="submit"
          variant="primary"
          disabled={processing}
          className="w-100"
          onClick={handleSubmit}
        >
          {processing ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            `Pay ${currency}${finalPrice} via ${getPaymentLabel()}`
          )}
        </Button>
      </Modal.Body>
    </Modal>
  );
}

export default PaymentModal;