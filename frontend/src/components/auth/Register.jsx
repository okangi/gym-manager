import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { getBranches } from '../../services/branchService';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-fill referral code from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) setReferralCode(ref);
  }, [location]);

  // Load active branches from backend
  useEffect(() => {
    const loadBranches = async () => {
      setBranchesLoading(true);
      try {
        const allBranches = await getBranches();
        const activeBranches = allBranches.filter(b => b.isActive);
        setBranches(activeBranches);
        if (activeBranches.length > 0) {
          setSelectedBranch(activeBranches[0].id);
        }
      } catch (err) {
        console.error('Error loading branches:', err);
        setError('Could not load branches. Please refresh the page.');
      } finally {
        setBranchesLoading(false);
      }
    };
    loadBranches();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!selectedBranch) {
      setError('Please select a branch');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare user data for backend
      const userData = {
        name,
        email: email.toLowerCase(),
        password,
        role: 'member',
        phone,
        branchId: selectedBranch,
        referralCode: referralCode || undefined
      };
      
      // Call backend registration through AuthContext
      const result = await register(userData);
      
      if (result.success) {
        setSuccess('Registration successful! Redirecting to dashboard...');
        setTimeout(() => {
          if (result.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (result.user.role === 'trainer') {
            navigate('/trainer/dashboard');
          } else {
            navigate('/member/dashboard');
          }
        }, 2000);
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <h2 className="text-center mb-4">Register</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                disabled={loading}
              />
            </Form.Group>

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
              <Form.Label>Phone Number</Form.Label>
              <Form.Control 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
                placeholder="0712345678"
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

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control 
                type="password" 
                value={confirm} 
                onChange={(e) => setConfirm(e.target.value)} 
                required 
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Referral Code (optional)</Form.Label>
              <Form.Control 
                type="text" 
                value={referralCode} 
                onChange={(e) => setReferralCode(e.target.value)} 
                placeholder="Enter code from friend"
                disabled={loading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Select Branch</Form.Label>
              <Form.Select 
                value={selectedBranch} 
                onChange={(e) => setSelectedBranch(e.target.value)} 
                required
                disabled={loading || branchesLoading}
              >
                <option value="">{branchesLoading ? 'Loading branches...' : 'Select a branch'}</option>
                {branches.map((branch, index) => (
                  <option key={branch.id || branch._id || `branch-${index}`} value={branch.id || branch._id}>
                    {branch.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100" disabled={loading || branchesLoading}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </Form>

          <div className="text-center mt-3">
            <Link to="/login">Already have an account? Login</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Register;