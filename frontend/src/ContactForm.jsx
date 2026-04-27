import { useState } from 'react';
import { addContactMessage } from '../services/landingService';
import { useTheme } from '../context/ThemeContext';

function ContactForm() {
  const { theme } = useTheme();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    addContactMessage(form);
    setSubmitted(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };

  const styles = {
    container: { maxWidth: '600px', margin: '0 auto' },
    input: {
      width: '100%',
      padding: '10px',
      marginBottom: '10px',
      borderRadius: '4px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    success: { color: '#4caf50', marginTop: '10px' }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.container}>
      <input type="text" name="name" placeholder="Your Name" value={form.name} onChange={handleChange} required style={styles.input} />
      <input type="email" name="email" placeholder="Your Email" value={form.email} onChange={handleChange} required style={styles.input} />
      <textarea name="message" placeholder="Your Message" value={form.message} onChange={handleChange} required rows="4" style={styles.input}></textarea>
      <button type="submit" style={styles.button}>Send Message</button>
      {submitted && <p style={styles.success}>Message sent! We'll get back to you soon.</p>}
    </form>
  );
}

export default ContactForm;