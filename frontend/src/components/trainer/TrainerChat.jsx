import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  getConversation,
  sendMessage,
  markConversationRead,
  getConversations
} from '../../services/chatService';
import { addNotification } from '../../services/notificationService';

function TrainerChat() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Helper function to get user ID
  const getUserId = (userObj) => {
    return userObj?._id || userObj?.id;
  };

  // Load conversations for this trainer
  useEffect(() => {
    const loadConversations = async () => {
      if (!token || !user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Get all conversations for this trainer
        const data = await getConversations(token);
        console.log('Raw conversations data:', data);
        
        // Handle both response formats
        let conversations = [];
        if (Array.isArray(data)) {
          conversations = data;
        } else if (data.conversations && Array.isArray(data.conversations)) {
          conversations = data.conversations;
        } else if (data.data && Array.isArray(data.data)) {
          conversations = data.data;
        }
        
        console.log('Processed conversations:', conversations);
        
        // Extract members from conversations
        const membersList = [];
        const trainerId = getUserId(user);
        
        conversations.forEach(conv => {
          // Extract member info from conversation object
          const memberId = conv._id || conv.id || conv.user?.id || conv.user?._id;
          const memberName = conv.name || conv.user?.name || conv.email || conv.user?.email || 'Member';
          const memberEmail = conv.email || conv.user?.email;
          const lastMessage = conv.lastMessage || conv.message || '';
          const unreadCount = conv.unreadCount || conv.unread || 0;
          
          if (memberId && memberId !== trainerId) {
            membersList.push({
              id: memberId,
              name: memberName,
              email: memberEmail,
              lastMessage: lastMessage,
              lastMessageTime: conv.lastMessageTime || conv.timestamp,
              unreadCount: typeof unreadCount === 'number' ? unreadCount : 0,
              unread: unreadCount > 0
            });
          }
        });
        
        console.log('Final members list:', membersList);
        setMembers(membersList);
        
        // If there are members and no selected member, select the first one
        if (membersList.length > 0 && !selectedMember) {
          setSelectedMember(membersList[0]);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadConversations();
  }, [token, user]);

  // Load conversation when member is selected
  useEffect(() => {
    const loadConversation = async () => {
      if (!selectedMember || !token || !user) return;
      
      const trainerId = getUserId(user);
      const memberId = selectedMember.id;
      
      if (!trainerId || !memberId) return;
      
      try {
        const conv = await getConversation(trainerId, memberId, token);
        setMessages(conv || []);
        
        // Mark as read
        await markConversationRead(memberId, token);
        
        // Update unread status in members list
        setMembers(prev => prev.map(m => 
          m.id === memberId ? { ...m, unread: false, unreadCount: 0 } : m
        ));
        
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } catch (error) {
        console.error('Error loading conversation:', error);
      }
    };
    
    loadConversation();
  }, [selectedMember, user, token]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedMember || sending) return;
    
    const trainerId = getUserId(user);
    const memberId = selectedMember.id;
    
    if (!trainerId || !memberId) return;
    
    setSending(true);
    try {
      const msg = await sendMessage(trainerId, memberId, newMessage, token);
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      
      // Send notification to member
      try {
        await addNotification({
          userId: memberId,
          title: 'New Message',
          message: `New message from Trainer ${user?.name || user?.email || 'Trainer'}`,
          type: 'info'
        }, token);
      } catch (notifyError) {
        console.log('Notification not sent (non-critical):', notifyError.message);
      }
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedMember || !token || !user) return;
    
    const trainerId = getUserId(user);
    const memberId = selectedMember.id;
    
    const interval = setInterval(async () => {
      try {
        const conv = await getConversation(trainerId, memberId, token);
        if (conv.length !== messages.length) {
          setMessages(conv);
          await markConversationRead(memberId, token);
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [selectedMember, user, token, messages.length]);

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
      backgroundColor: '#28a745',
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
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      opacity: sending ? 0.7 : 1
    },
    memberItem: {
      padding: '10px',
      marginBottom: '8px',
      borderRadius: '8px',
      cursor: 'pointer',
      backgroundColor: theme === 'dark' ? '#0f3460' : '#fff',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`,
      color: theme === 'dark' ? '#eee' : '#333',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    activeMember: {
      backgroundColor: '#28a745',
      color: 'white',
      borderColor: '#28a745'
    },
    unreadBadge: {
      backgroundColor: 'red',
      color: 'white',
      borderRadius: '50%',
      padding: '2px 6px',
      fontSize: '12px',
      minWidth: '20px',
      textAlign: 'center',
      fontWeight: 'bold'
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '40px',
      color: theme === 'dark' ? '#aaa' : '#666'
    },
    emptyText: {
      textAlign: 'center',
      padding: '40px',
      color: theme === 'dark' ? '#aaa' : '#666'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <h3 style={{ color: theme === 'dark' ? '#fff' : '#333' }}>💬 Members</h3>
          <div style={styles.loadingContainer}>Loading conversations...</div>
        </div>
        <div style={styles.chatArea}>
          <div style={styles.emptyText}>Loading chat...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h3 style={{ color: theme === 'dark' ? '#fff' : '#333' }}>💬 Members</h3>
        {members.length === 0 ? (
          <div style={styles.emptyText}>
            No conversations yet.<br/>
            Members will appear here when they message you.
          </div>
        ) : (
          members.map(m => (
            <div
              key={m.id}
              onClick={() => setSelectedMember(m)}
              style={{
                ...styles.memberItem,
                ...(selectedMember?.id === m.id ? styles.activeMember : {})
              }}
            >
              <span>{m.name || m.email}</span>
              {m.unreadCount > 0 && (
                <span style={styles.unreadBadge}>{m.unreadCount}</span>
              )}
            </div>
          ))
        )}
      </div>

      <div style={styles.chatArea}>
        {selectedMember ? (
          <>
            <div style={{ 
              padding: '12px', 
              borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`, 
              fontWeight: 'bold', 
              color: theme === 'dark' ? '#fff' : '#333' 
            }}>
              💬 Chat with {selectedMember.name || selectedMember.email}
            </div>
            <div id="chat-messages" style={styles.messagesContainer}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  No messages yet. Send a message to start the conversation!
                </div>
              )}
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
            Select a member to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainerChat;