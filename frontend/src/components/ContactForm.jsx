import { useState } from 'react';
import { addContactMessage } from '../services/landingService';
import { useTheme } from '../context/ThemeContext';

function ContactForm() {
  const { theme } = useTheme();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    
    setLoading(true);
    setError('');
    
    try {
      await addContactMessage(form);
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { maxWidth: '600px', margin: '0 auto' },
    input: {
      width: '100%',
      padding: '10px',
      marginBottom: '10px',
      borderRadius: '8px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      opacity: loading ? 0.7 : 1
    },
    success: { color: '#4caf50', marginTop: '10px' },
    error: { color: '#f44336', marginTop: '10px' }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.container}>
      <input 
        type="text" 
        name="name" 
        placeholder="Your Name" 
        value={form.name} 
        onChange={handleChange} 
        required 
        disabled={loading}
        style={styles.input} 
      />
      <input 
        type="email" 
        name="email" 
        placeholder="Your Email" 
        value={form.email} 
        onChange={handleChange} 
        required 
        disabled={loading}
        style={styles.input} 
      />
      <textarea 
        name="message" 
        placeholder="Your Message" 
        value={form.message} 
        onChange={handleChange} 
        required 
        rows="4" 
        disabled={loading}
        style={styles.input}
      ></textarea>
      <button type="submit" style={styles.button} disabled={loading}>
        {loading ? 'Sending...' : 'Send Message'}
      </button>
      {submitted && <p style={styles.success}>✅ Message sent! We'll get back to you soon.</p>}
      {error && <p style={styles.error}>❌ {error}</p>}
    </form>
  );
}

export default ContactForm;