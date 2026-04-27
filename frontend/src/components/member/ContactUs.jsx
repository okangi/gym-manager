import { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { addContactMessage } from '../../services/landingService';

function ContactUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const messageData = {
      name,
      email,
      phone,
      subject,
      message
    };

    try {
      const result = await addContactMessage(messageData);
      if (result) {
        setSuccess('Message sent successfully! We will get back to you soon.');
        // Reset form
        setName('');
        setEmail('');
        setPhone('');
        setSubject('');
        setMessage('');
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="mt-4 mb-4">
      <Card>
        <Card.Body>
          <h3 className="mb-4">Contact Us</h3>
          <p className="text-muted mb-4">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
          
          {success && <Alert variant="success">{success}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={submitting}
                placeholder="Enter your full name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                placeholder="Enter your email address"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
                placeholder="Enter your phone number (optional)"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subject *</Form.Label>
              <Form.Control
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                disabled={submitting}
                placeholder="What is this regarding?"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message *</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                disabled={submitting}
                placeholder="Please provide details about your inquiry..."
              />
            </Form.Group>

            <Button 
              type="submit" 
              variant="primary" 
              disabled={submitting}
              className="w-100"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ContactUs;