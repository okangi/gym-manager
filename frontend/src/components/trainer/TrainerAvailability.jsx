import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getTrainerAvailability, saveAvailability, deleteAvailability, getBookingByAvailabilityId } from '../../services/privateSessionService';
import { addActivityLog } from '../../services/activityLogger';

function TrainerAvailability() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '' });
  const [expandedSlot, setExpandedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadSlots();
  }, [user?.id, token]);

  const loadSlots = async () => {
    if (!token || !user?.id) return;
    setLoading(true);
    try {
      // Get all availability for this trainer
      const availability = await getTrainerAvailability(user.id, token);
      const availabilityArray = Array.isArray(availability) ? availability : [];
      
      // Enrich slots with booking info if booked
      const enriched = await Promise.all(availabilityArray.map(async (slot) => {
        if (slot.booked || slot.status === 'booked') {
          try {
            const booking = await getBookingByAvailabilityId(slot.id, token);
            if (booking) {
              return { 
                ...slot, 
                booked: true,
                memberName: booking.memberName || booking.userName || 'Member',
                memberEmail: booking.memberEmail || booking.userEmail || 'N/A',
                memberPhone: booking.memberPhone || 'Not provided',
                memberId: booking.userId
              };
            }
          } catch (err) {
            console.error('Error fetching booking:', err);
          }
        }
        return { ...slot, booked: slot.booked || slot.status === 'booked' };
      }));
      
      // Sort slots by date
      enriched.sort((a, b) => new Date(a.sessionDate || a.date) - new Date(b.sessionDate || b.date));
      setSlots(enriched);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      alert('Please fill all fields');
      return;
    }
    
    setAdding(true);
    try {
      const slotData = {
        trainerId: user.id,
        sessionDate: newSlot.date,
        date: newSlot.date,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        status: 'available',
        booked: false,
        branchId: user.branchId
      };
      
      await saveAvailability(slotData, token);
      await addActivityLog(user?.email, 'Availability Added', `Added slot on ${newSlot.date} ${newSlot.startTime}-${newSlot.endTime}`, token);
      await loadSlots();
      setNewSlot({ date: '', startTime: '', endTime: '' });
    } catch (error) {
      console.error('Error adding slot:', error);
      alert('Failed to add availability slot. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this availability slot?')) {
      try {
        await deleteAvailability(id, token);
        await loadSlots();
        await addActivityLog(user?.email, 'Availability Deleted', `Deleted slot`, token);
      } catch (error) {
        console.error('Error deleting slot:', error);
        alert('Failed to delete slot. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    form: { 
      marginBottom: '20px', 
      padding: '16px', 
      backgroundColor: 'var(--card-bg)', 
      borderRadius: '8px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`
    },
    inputGroup: { 
      display: 'flex', 
      gap: '10px', 
      flexWrap: 'wrap',
      alignItems: 'center'
    },
    input: { 
      padding: '8px', 
      borderRadius: '4px', 
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`, 
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', 
      color: theme === 'dark' ? '#eee' : '#333' 
    },
    addButton: {
      padding: '8px 16px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    slotCard: { 
      padding: '12px', 
      marginBottom: '8px', 
      backgroundColor: 'var(--card-bg)', 
      borderRadius: '6px', 
      border: '1px solid var(--border-color)', 
      color: theme === 'dark' ? '#eee' : '#333' 
    },
    slotHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px'
    },
    slotInfo: {
      flex: 1
    },
    slotActions: {
      display: 'flex',
      gap: '8px'
    },
    bookedText: { color: '#ff9800', marginLeft: '10px', fontWeight: 'bold' },
    availableText: { color: '#4caf50', marginLeft: '10px', fontWeight: 'bold' },
    deleteButton: { 
      padding: '4px 12px', 
      backgroundColor: '#dc3545', 
      color: 'white', 
      border: 'none', 
      borderRadius: '4px', 
      cursor: 'pointer' 
    },
    detailsButton: { 
      padding: '4px 12px', 
      backgroundColor: '#6c757d', 
      color: 'white', 
      border: 'none', 
      borderRadius: '4px', 
      cursor: 'pointer' 
    },
    memberDetails: { 
      marginTop: '12px', 
      padding: '12px', 
      backgroundColor: theme === 'dark' ? '#1e2a3a' : '#f8f9fa', 
      borderRadius: '4px', 
      fontSize: '14px', 
      color: theme === 'dark' ? '#eee' : '#333',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '40px',
      color: 'var(--text-secondary)'
    },
    emptyText: {
      textAlign: 'center',
      padding: '40px',
      color: 'var(--text-secondary)'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Manage Private Session Availability</h2>
        <div style={styles.loadingContainer}>Loading availability slots...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Manage Private Session Availability</h2>
      
      <div style={styles.form}>
        <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Add New Available Slot</h3>
        <div style={styles.inputGroup}>
          <input 
            type="date" 
            value={newSlot.date} 
            onChange={e => setNewSlot({ ...newSlot, date: e.target.value })} 
            style={styles.input} 
          />
          <input 
            type="time" 
            value={newSlot.startTime} 
            onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })} 
            style={styles.input} 
          />
          <input 
            type="time" 
            value={newSlot.endTime} 
            onChange={e => setNewSlot({ ...newSlot, endTime: e.target.value })} 
            style={styles.input} 
          />
          <button onClick={handleAdd} style={styles.addButton} disabled={adding}>
            {adding ? 'Adding...' : '+ Add Slot'}
          </button>
        </div>
      </div>

      <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>Your Availability Slots</h3>
      
      {slots.length === 0 ? (
        <div style={styles.emptyText}>
          No availability slots added yet. Add your first slot above.
        </div>
      ) : (
        slots.map(slot => (
          <div key={slot.id || slot._id} style={styles.slotCard}>
            <div style={styles.slotHeader}>
              <div style={styles.slotInfo}>
                <strong>📅 {formatDate(slot.sessionDate || slot.date)}</strong> 
                <span> | 🕐 {slot.startTime} - {slot.endTime}</span>
                {slot.booked ? (
                  <span style={styles.bookedText}>🔴 Booked</span>
                ) : (
                  <span style={styles.availableText}>🟢 Available</span>
                )}
              </div>
              <div style={styles.slotActions}>
                {!slot.booked && (
                  <button onClick={() => handleDelete(slot.id || slot._id)} style={styles.deleteButton}>
                    Delete
                  </button>
                )}
                {slot.booked && (
                  <button 
                    onClick={() => setExpandedSlot(expandedSlot === (slot.id || slot._id) ? null : (slot.id || slot._id))} 
                    style={styles.detailsButton}
                  >
                    {expandedSlot === (slot.id || slot._id) ? 'Hide Member' : 'Show Member'}
                  </button>
                )}
              </div>
            </div>
            
            {slot.booked && expandedSlot === (slot.id || slot._id) && (
              <div style={styles.memberDetails}>
                <strong>👤 Member Details:</strong><br />
                <strong>Name:</strong> {slot.memberName || 'Member'}<br />
                <strong>Email:</strong> {slot.memberEmail || 'N/A'}<br />
                <strong>Phone:</strong> {slot.memberPhone || 'Not provided'}
              </div>
            )}
          </div>
        ))
      )}
      
      {slots.length > 0 && (
        <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Total slots: {slots.length} | Available: {slots.filter(s => !s.booked).length} | Booked: {slots.filter(s => s.booked).length}
        </div>
      )}
    </div>
  );
}

export default TrainerAvailability;