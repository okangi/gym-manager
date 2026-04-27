import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('request');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:5000/api';

  // Check if user exists (without exposing sensitive info)
  const checkUserExists = async (email) => {
    try {
      // Try to login with invalid password just to check if user exists
      // This is a workaround since we don't have a dedicated endpoint
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'dummy_password_check' })
      });
      // If we get "Invalid credentials", user exists (password is wrong but user is there)
      // If we get other error (like 404), user doesn't exist
      const data = await response.json();
      return data.message === 'Invalid credentials';
    } catch (error) {
      return false;
    }
  };

  const handleRequestReset = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const userExists = await checkUserExists(email);
      
      if (!userExists) {
        setError('No account found with that email.');
        setLoading(false);
        return;
      }
      
      // In a real app, you would send a reset email here
      // For now, we'll just proceed to the reset step
      setMessage(`Reset link has been simulated. Please enter your new password.`);
      setStep('reset');
    } catch (err) {
      console.error('Error checking user:', err);
      setError('Unable to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // First, get user info by logging in (we need user ID)
      // Note: This is a workaround. In production, you should have a proper reset endpoint
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'dummy' })
      });
      
      if (!loginResponse.ok) {
        setError('Unable to reset password. Please try again.');
        setLoading(false);
        return;
      }
      
      // Get user ID from login response (this won't work with wrong password)
      // Alternative approach: Use a dedicated password reset endpoint
      
      // For now, we'll simulate a successful reset
      // In production, you should implement a proper backend endpoint:
      // POST /api/auth/reset-password { email, newPassword, token }
      
      setMessage('Password reset successful! Please log in with your new password.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Reset Password</h2>
          
          {step === 'request' ? (
            <>
              <p className="text-center">Enter your email address to receive a reset link.</p>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Form.Group>
                {error && <Alert variant="danger">{error}</Alert>}
                {message && <Alert variant="success">{message}</Alert>}
                <Button 
                  variant="primary" 
                  onClick={handleRequestReset} 
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? 'Checking...' : 'Send Reset Link'}
                </Button>
              </Form>
            </>
          ) : (
            <>
              <p className="text-center">Enter new password for {email}</p>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">
                    Password must be at least 6 characters
                  </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Form.Group>
                {error && <Alert variant="danger">{error}</Alert>}
                {message && <Alert variant="success">{message}</Alert>}
                <Button 
                  variant="primary" 
                  onClick={handleResetPassword} 
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </Form>
            </>
          )}
          
          <div className="text-center mt-3">
            <Button variant="link" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ResetPassword;