import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getMembersByBranch } from '../../services/userService'; // Change this
import { getProgressEntries } from '../../services/progressService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function TrainerProgress() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [user?.branchId, token]);

  const loadMembers = async () => {
    if (!token || !user?.branchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Use getMembersByBranch instead of getUsers
      const branchMembers = await getMembersByBranch(user.branchId, token);
      const membersArray = Array.isArray(branchMembers) ? branchMembers : [];
      setMembers(membersArray);
    } catch (error) {
      console.error('Error loading members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMember) {
      loadMemberProgress();
    }
  }, [selectedMember, token]);

  const loadMemberProgress = async () => {
    if (!selectedMember || !token) return;
    try {
      const memberId = selectedMember.id || selectedMember._id;
      const memberEntries = await getProgressEntries(memberId, token);
      // Sort by date
      memberEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
      setEntries(memberEntries);
    } catch (error) {
      console.error('Error loading member progress:', error);
      setEntries([]);
    }
  };

  const getMemberId = (member) => {
    return member.id || member._id;
  };

  const chartData = entries.map(e => ({
    date: new Date(e.date).toLocaleDateString(),
    weight: e.weight,
    bodyFat: e.bodyFat
  }));

  const styles = {
    container: { padding: '20px' },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    select: {
      padding: '8px',
      marginBottom: '20px',
      width: '100%',
      maxWidth: '300px',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      borderRadius: '4px'
    },
    chartContainer: { height: '300px', marginBottom: '20px' },
    entryCard: {
      padding: '12px',
      marginBottom: '8px',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '6px',
      border: '1px solid var(--border-color)',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    emptyText: { color: theme === 'dark' ? '#aaa' : '#666', textAlign: 'center', padding: '20px' },
    loadingText: { textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }
  };

  if (loading) {
    return <div style={styles.loadingText}>Loading members...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Member Progress Tracking</h2>
      
      <select
        onChange={e => {
          const member = members.find(m => getMemberId(m) === e.target.value);
          setSelectedMember(member);
        }}
        style={styles.select}
        value={selectedMember ? getMemberId(selectedMember) : ''}
      >
        <option value="">Select a member</option>
        {members.map(m => (
          <option key={getMemberId(m)} value={getMemberId(m)}>
            {m.name || m.email || 'Member'}
          </option>
        ))}
      </select>

      {selectedMember && (
        <>
          <h3 style={{ color: 'var(--text-primary)' }}>
            Progress for {selectedMember.name || selectedMember.email}
          </h3>
          {entries.length === 0 ? (
            <p style={styles.emptyText}>No progress entries yet for this member.</p>
          ) : (
            <>
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#444' : '#ddd'} />
                    <XAxis dataKey="date" stroke={theme === 'dark' ? '#ccc' : '#333'} />
                    <YAxis stroke={theme === 'dark' ? '#ccc' : '#333'} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', 
                        borderColor: theme === 'dark' ? '#444' : '#ddd',
                        color: theme === 'dark' ? '#eee' : '#333'
                      }} 
                    />
                    <Legend wrapperStyle={{ color: theme === 'dark' ? '#eee' : '#333' }} />
                    <Line type="monotone" dataKey="weight" stroke="#1877f2" strokeWidth={2} name="Weight (kg)" />
                    {chartData.some(d => d.bodyFat) && (
                      <Line type="monotone" dataKey="bodyFat" stroke="#4caf50" strokeWidth={2} name="Body Fat %" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <h3 style={{ color: 'var(--text-primary)' }}>All Entries</h3>
              {entries.map(entry => (
                <div key={entry.id || entry._id} style={styles.entryCard}>
                  <strong>{new Date(entry.date).toLocaleDateString()}</strong> – Weight: {entry.weight} kg
                  {entry.bodyFat && <span> | Body Fat: {entry.bodyFat}%</span>}
                  {entry.notes && <div><em>Notes:</em> {entry.notes}</div>}
                  {entry.createdByName && (
                    <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                      Recorded by: {entry.createdByName}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </>
      )}
      
      {members.length === 0 && !loading && (
        <p style={styles.emptyText}>No members found in your branch.</p>
      )}
    </div>
  );
}

export default TrainerProgress;