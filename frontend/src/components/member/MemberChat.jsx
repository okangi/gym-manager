import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getTrainers } from '../../services/trainerService';
import { getConversation, sendMessage, markConversationRead, getUnreadCountForConversation } from '../../services/chatService';
import { addNotification } from '../../services/notificationService';

function MemberChat() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadMap, setUnreadMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Helper function to get user ID (handles both _id and id)
  const getUserId = (userObj) => {
    return userObj?._id || userObj?.id;
  };

  // Load all active trainers
  useEffect(() => {
    const loadTrainers = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const allTrainers = await getTrainers(token);
        const activeTrainers = allTrainers.filter(t => t.isActive !== false);
        setTrainers(activeTrainers);
        
        // Calculate unread counts for each trainer
        const unreads = {};
        for (const trainer of activeTrainers) {
          const trainerId = getUserId(trainer);
          const currentUserId = getUserId(user);
          
          if (currentUserId && trainerId) {
            const count = await getUnreadCountForConversation(trainerId, token);
            if (count > 0) unreads[trainerId] = count;
          }
        }
        setUnreadMap(unreads);
      } catch (error) {
        console.error('Error loading trainers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user && token) {
      loadTrainers();
    }
  }, [token, user]);

  // Load conversation when trainer is selected
  useEffect(() => {
    const loadConversation = async () => {
      if (!selectedTrainer || !token || !user) return;
      
      const currentUserId = getUserId(user);
      const trainerId = selectedTrainer;
      
      if (!currentUserId || !trainerId) {
        console.error('Missing user IDs:', { currentUserId, trainerId });
        return;
      }
      
      try {
        const conv = await getConversation(currentUserId, trainerId, token);
        setMessages(conv);
        
        // FIXED: Only pass trainerId and token (not user.id)
        await markConversationRead(trainerId, token);
        setUnreadMap(prev => ({ ...prev, [trainerId]: 0 }));
        
        // Scroll to bottom
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } catch (error) {
        console.error('Error loading conversation:', error);
      }
    };
    
    loadConversation();
  }, [selectedTrainer, user, token]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedTrainer || sending) return;
    
    const currentUserId = getUserId(user);
    const trainerId = selectedTrainer;
    
    if (!currentUserId || !trainerId) {
      console.error('Missing user IDs for sending message');
      alert('Unable to send message. Missing user information.');
      return;
    }
    
    setSending(true);
    try {
      const msg = await sendMessage(currentUserId, trainerId, newMessage, token);
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      
      // Send notification to trainer
      await addNotification({
        userId: trainerId,
        title: 'New Message',
        message: `New message from ${user.name || user.email || 'Member'}`,
        type: 'info'
      }, token);
      
      // Scroll to bottom
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Poll for new messages every 3 seconds when chat is open
  useEffect(() => {
    if (!selectedTrainer || !token || !user) return;
    
    const currentUserId = getUserId(user);
    const trainerId = selectedTrainer;
    
    if (!currentUserId || !trainerId) return;
    
    const interval = setInterval(async () => {
      try {
        const conv = await getConversation(currentUserId, trainerId, token);
        setMessages(conv);
        // FIXED: Only pass trainerId and token (not user.id)
        await markConversationRead(trainerId, token);
        setUnreadMap(prev => ({ ...prev, [trainerId]: 0 }));
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [selectedTrainer, user, token]);

  // Update unread counts periodically
  useEffect(() => {
    if (!token || trainers.length === 0 || !user) return;
    
    const currentUserId = getUserId(user);
    if (!currentUserId) return;
    
    const updateUnreads = async () => {
      const newUnreads = {};
      for (const trainer of trainers) {
        const trainerId = getUserId(trainer);
        if (trainerId) {
          const count = await getUnreadCountForConversation(trainerId, token);
          if (count > 0) newUnreads[trainerId] = count;
        }
      }
      setUnreadMap(newUnreads);
    };
    
    const interval = setInterval(updateUnreads, 5000);
    return () => clearInterval(interval);
  }, [trainers, user, token]);

  const styles = {
    container: { display: 'flex', gap: '20px', padding: '20px', minHeight: '70vh' },
    sidebar: {
      width: '280px',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#f8f9fa',
      borderRadius: '8px',
      padding: '16px',
      border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`
    },
    chatArea: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#0f3460' : '#fff',
      borderRadius: '8px',
      border: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
      display: 'flex',
      flexDirection: 'column',
      height: '500px'
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column'
    },
    messageBubble: {
      maxWidth: '70%',
      marginBottom: '12px',
      padding: '8px 12px',
      borderRadius: '12px',
      wordWrap: 'break-word'
    },
    myMessage: {
      alignSelf: 'flex-end',
      backgroundColor: '#1877f2',
      color: 'white'
    },
    theirMessage: {
      alignSelf: 'flex-start',
      backgroundColor: theme === 'dark' ? '#2a4a6e' : '#e9ecef',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    inputArea: {
      display: 'flex',
      padding: '12px',
      borderTop: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`
    },
    input: {
      flex: 1,
      padding: '8px',
      borderRadius: '4px',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    sendButton: {
      marginLeft: '8px',
      padding: '8px 16px',
      backgroundColor: '#1877f2',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      opacity: sending ? 0.7 : 1
    },
    trainerItem: {
      padding: '10px',
      marginBottom: '8px',
      borderRadius: '8px',
      cursor: 'pointer',
      backgroundColor: theme === 'dark' ? '#0f3460' : '#fff',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`,
      color: theme === 'dark' ? '#eee' : '#333'
    },
    activeTrainer: {
      backgroundColor: '#1877f2',
      color: 'white',
      borderColor: '#1877f2'
    },
    unreadBadge: {
      backgroundColor: 'red',
      color: 'white',
      borderRadius: '50%',
      padding: '2px 6px',
      fontSize: '12px',
      marginLeft: '8px'
    },
    loading: {
      textAlign: 'center',
      padding: '20px',
      color: theme === 'dark' ? '#aaa' : '#666'
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading chat...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h3 style={{ color: theme === 'dark' ? '#fff' : '#333' }}>Trainers</h3>
        {trainers.length === 0 && (
          <p style={{ color: theme === 'dark' ? '#aaa' : '#666' }}>No trainers available.</p>
        )}
        {trainers.map(t => {
          const trainerId = getUserId(t);
          return (
            <div
              key={trainerId}
              onClick={() => setSelectedTrainer(trainerId)}
              style={{
                ...styles.trainerItem,
                ...(selectedTrainer === trainerId ? styles.activeTrainer : {})
              }}
            >
              {t.name || t.fullName || 'Trainer'}
              {unreadMap[trainerId] > 0 && (
                <span style={styles.unreadBadge}>{unreadMap[trainerId]}</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.chatArea}>
        {selectedTrainer ? (
          <>
            <div style={{ 
              padding: '12px', 
              borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`, 
              fontWeight: 'bold', 
              color: theme === 'dark' ? '#fff' : '#333' 
            }}>
              Chat with {trainers.find(t => getUserId(t) === selectedTrainer)?.name || 'Trainer'}
            </div>
            <div id="chat-messages" style={styles.messagesContainer}>
              {messages.map((msg, idx) => (
                <div
                  key={msg.id || msg._id || idx}
                  style={{
                    ...styles.messageBubble,
                    ...(msg.fromUserId === getUserId(user) ? styles.myMessage : styles.theirMessage)
                  }}
                >
                  {msg.message}
                  <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
                    {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div style={styles.inputArea}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                style={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={sending}
              />
              <button onClick={handleSend} style={styles.sendButton} disabled={sending}>
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            color: theme === 'dark' ? '#aaa' : '#666' 
          }}>
            Select a trainer to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberChat;