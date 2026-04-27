import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getPlans } from '../../services/planService';
import { getActiveMembership } from '../../services/membershipService';
import { addActivityLog } from '../../services/activityLogger';
import PaymentModal from '../common/PaymentModal';
import { createPayment } from '../../services/paymentService';
import { addReferralCredit } from '../../services/userService';
import { addNotification } from '../../services/notificationService';
import { getCurrencySymbol } from '../../utils/currency';

const getStyles = (theme) => ({
  title: { color: theme === 'dark' ? '#fff' : '#333', marginBottom: '20px' },
  message: { color: '#4caf50', marginBottom: '16px' },
  error: { color: '#f44336', marginBottom: '16px' },
  activePlanBanner: {
    backgroundColor: theme === 'dark' ? '#0f3460' : '#e3f2fd',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    color: theme === 'dark' ? '#eee' : '#0d47a1',
    textAlign: 'center'
  },
  planList: { display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' },
  planCard: {
    padding: '16px',
    backgroundColor: theme === 'dark' ? '#0f3460' : '#f8f9fa',
    borderRadius: '8px',
    border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`,
    color: theme === 'dark' ? '#eee' : '#333'
  },
  planName: { margin: '0 0 8px 0', color: theme === 'dark' ? '#fff' : '#1877f2' },
  planDuration: { color: theme === 'dark' ? '#ccc' : '#555', marginBottom: '8px' },
  featureList: { paddingLeft: '20px', margin: '8px 0' },
  featureItem: { color: theme === 'dark' ? '#ccc' : '#555', marginBottom: '4px' },
  joinButton: {
    padding: '8px 16px',
    backgroundColor: '#1877f2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '12px',
    width: '100%'
  }
});

function MembershipPlans() {
  const { user, token, refreshUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const styles = getStyles(theme);
  const [plans, setPlans] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeMembership, setActiveMembership] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [actionType, setActionType] = useState('join');
  const [redeemedDiscount, setRedeemedDiscount] = useState(0);
  const [currency, setCurrency] = useState('$');

  useEffect(() => {
    const loadCurrency = async () => {
      const symbol = await getCurrencySymbol();
      setCurrency(symbol);
    };
    loadCurrency();
    
    const handleSettingsUpdate = async () => {
      const symbol = await getCurrencySymbol();
      setCurrency(symbol);
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  const loadPlans = async () => {
    try {
      const allPlans = await getPlans();
      setPlans(allPlans.filter(p => p.isActive !== false));
    } catch (error) {
      console.error('Error loading plans:', error);
      setError('Failed to load plans. Please refresh.');
    }
  };

  const loadActiveMembership = async () => {
    if (!user?.id && !user?._id) return null;
    
    const userId = user.id || user._id;
    
    try {
      // ALWAYS fetch from backend - source of truth
      const active = await getActiveMembership(userId, token);
      console.log('Membership from API:', active);
      setActiveMembership(active);
      return active;
    } catch (error) {
      console.error('Error loading membership:', error);
      return null;
    }
  };

  // Listen for user updates
  useEffect(() => {
    const handleUserUpdate = async () => {
      console.log('User update received, reloading membership...');
      await loadActiveMembership();
    };
    
    window.addEventListener('userUpdated', handleUserUpdate);
    window.addEventListener('membershipUpdated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
      window.removeEventListener('membershipUpdated', handleUserUpdate);
    };
  }, [user?.id, token]);

  useEffect(() => {
    const storedDiscount = localStorage.getItem('gym_redeemed_discount');
    if (storedDiscount) {
      setRedeemedDiscount(parseInt(storedDiscount));
      localStorage.removeItem('gym_redeemed_discount');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadPlans(), loadActiveMembership()]);
      setLoading(false);
    };
    init();
  }, [user?.id, user?._id, token]);

  useEffect(() => {
    const handleCreditsRedeemed = (e) => {
      const amount = e.detail?.amount || 0;
      setRedeemedDiscount(amount);
      localStorage.setItem('gym_redeemed_discount', amount);
    };
    window.addEventListener('creditsRedeemed', handleCreditsRedeemed);
    return () => window.removeEventListener('creditsRedeemed', handleCreditsRedeemed);
  }, []);

  const openPaymentModal = (plan, type) => {
    const storedDiscount = localStorage.getItem('gym_redeemed_discount');
    if (storedDiscount && !redeemedDiscount) {
      const discount = parseInt(storedDiscount);
      setRedeemedDiscount(discount);
      localStorage.removeItem('gym_redeemed_discount');
    }
    setSelectedPlan(plan);
    setActionType(type);
    setModalShow(true);
  };

  const handleUpgrade = async (plan) => {
    const currentMembership = await loadActiveMembership();
    
    if (!currentMembership) {
      setError('❌ No active membership to upgrade. Please join a plan first.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (currentMembership.planId === (plan.id || plan._id)) {
      setError('❌ You are already on this plan.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    console.log('Upgrading from:', currentMembership.planName, 'to:', plan.name);
    openPaymentModal(plan, 'upgrade');
  };

  const handlePaymentSuccess = async () => {
    const usedDiscount = redeemedDiscount;
    const finalPrice = Math.max(0, selectedPlan.price - usedDiscount);

    setLoading(true);
    
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPlan.durationDays);
      
      const membershipData = {
        userId: user.id,
        planId: selectedPlan.id || selectedPlan._id,
        planName: selectedPlan.name,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        amount: finalPrice,
        paymentMethod: 'Card',
        action: actionType
      };
      
      const paymentData = {
        amount: finalPrice,
        planId: selectedPlan.id || selectedPlan._id,
        planName: selectedPlan.name,
        durationDays: selectedPlan.durationDays,
        paymentMethod: 'Card',
        notes: `${actionType === 'join' ? 'New' : 'Upgrade'} membership - ${selectedPlan.name}`
      };
      
      console.log('Creating payment...');
      await createPayment(paymentData, token);
      
      const endpoint = actionType === 'upgrade' ? '/memberships/upgrade' : '/memberships';
      const response = await fetch(`http://localhost:5000/api${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(membershipData)
      });
      
      const result = await response.json();
      console.log('Membership API response:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create membership');
      }
      
      // Refresh user data from backend
      await refreshUser();
      
      setMessage(`✅ You have successfully ${actionType === 'join' ? 'joined' : 'upgraded to'} ${selectedPlan.name} plan!`);
      
      // Reload membership from backend
      await loadActiveMembership();
      
      // Dispatch events
      window.dispatchEvent(new CustomEvent('membershipUpdated'));
      window.dispatchEvent(new CustomEvent('userUpdated'));
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/member/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Payment processing error:', error);
      setError('❌ Failed to process payment. ' + error.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
      setModalShow(false);
    }
  };

  const handleJoin = async (plan) => {
    const membership = await loadActiveMembership();
    if (membership) {
      setError('❌ You already have an active membership. Use the Upgrade button to change your plan.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    openPaymentModal(plan, 'join');
  };

  if (loading && plans.length === 0) {
    return <div style={styles.title}>Loading membership plans...</div>;
  }

  return (
    <div>
      <h2 style={styles.title}>Membership Plans</h2>
      {activeMembership && (
        <div style={styles.activePlanBanner}>
          <p>✅ Your current plan: <strong>{activeMembership.planName}</strong></p>
          <p>Expires: {new Date(activeMembership.endDate).toLocaleDateString()}</p>
          <p>Choose a different plan to upgrade.</p>
        </div>
      )}
      {message && <p style={styles.message}>{message}</p>}
      {error && <p style={styles.error}>{error}</p>}
      <div style={styles.planList}>
        {plans.map(plan => {
          const isCurrentPlan = activeMembership && activeMembership.planId === (plan.id || plan._id);
          return (
            <div key={plan.id || plan._id} style={styles.planCard}>
              <h3 style={styles.planName}>{plan.name} - {currency}{plan.price}</h3>
              <p style={styles.planDuration}>{plan.durationDays} days</p>
              <ul style={styles.featureList}>
                {(plan.features || []).map((f, i) => <li key={i} style={styles.featureItem}>{f}</li>)}
              </ul>
              {activeMembership ? (
                <button
                  onClick={() => handleUpgrade(plan)}
                  style={{
                    ...styles.joinButton,
                    opacity: (loading || isCurrentPlan) ? 0.6 : 1
                  }}
                  disabled={loading || isCurrentPlan}
                >
                  {isCurrentPlan ? '✓ Current Plan' : loading ? 'Processing...' : 'Upgrade'}
                </button>
              ) : (
                <button
                  onClick={() => handleJoin(plan)}
                  style={{
                    ...styles.joinButton,
                    opacity: loading ? 0.6 : 1
                  }}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Join Now'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <PaymentModal
          show={modalShow}
          onHide={() => setModalShow(false)}
          plan={selectedPlan}
          actionType={actionType}
          onSuccess={handlePaymentSuccess}
          redeemedDiscount={redeemedDiscount}
        />
      )}
    </div>
  );
}

export default MembershipPlans;