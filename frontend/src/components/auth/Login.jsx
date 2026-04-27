import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { requestNotificationPermission } from '../../services/notificationService';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Call the backend API through AuthContext
      const result = await login(email, password);
      
      if (result.success) {
        // Request notification permission
        requestNotificationPermission();
        
        // Navigate based on user role
        setTimeout(() => {
          if (result.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (result.user.role === 'trainer') {
            navigate('/trainer/dashboard');
          } else {
            navigate('/member/dashboard');
          }
        }, 100);
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Login</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
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
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                disabled={loading}
              />
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>
          <div className="text-center mt-3">
            <Link to="/register">Don't have an account? Register</Link><br />
            <Link to="/reset-password">Forgot Password?</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;