import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getMembersByBranch } from '../../services/userService';
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

  // Calculate progress stats
  const getProgressStats = () => {
    if (entries.length === 0) return null;
    const firstEntry = entries[0];
    const lastEntry = entries[entries.length - 1];
    const weightChange = lastEntry.weight - firstEntry.weight;
    const bodyFatChange = lastEntry.bodyFat && firstEntry.bodyFat ? lastEntry.bodyFat - firstEntry.bodyFat : null;
    
    return {
      startWeight: firstEntry.weight,
      currentWeight: lastEntry.weight,
      weightChange: weightChange,
      weightChangePercent: (weightChange / firstEntry.weight * 100).toFixed(1),
      startBodyFat: firstEntry.bodyFat,
      currentBodyFat: lastEntry.bodyFat,
      bodyFatChange: bodyFatChange,
      totalEntries: entries.length
    };
  };

  const styles = {
    container: { 
      padding: '20px',
      maxWidth: '100%',
      overflowX: 'hidden'
    },
    title: { color: 'var(--text-primary)', marginBottom: '20px' },
    select: {
      padding: '8px',
      marginBottom: '20px',
      width: '100%',
      maxWidth: '100%',
      backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white',
      color: theme === 'dark' ? '#eee' : '#333',
      border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
      borderRadius: '4px'
    },
    chartContainer: { 
      height: '300px', 
      marginBottom: '20px',
      width: '100%'
    },
    entriesContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '12px',
      marginTop: '16px'
    },
    entryCard: {
      padding: '12px',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '6px',
      border: '1px solid var(--border-color)',
      color: theme === 'dark' ? '#eee' : '#333'
    },
    emptyText: { 
      color: theme === 'dark' ? '#aaa' : '#666', 
      textAlign: 'center', 
      padding: '20px' 
    },
    loadingText: { 
      textAlign: 'center', 
      padding: '40px', 
      color: 'var(--text-secondary)' 
    },
    memberName: {
      marginBottom: '16px',
      color: 'var(--text-primary)',
      fontSize: '1.2rem'
    },
    progressStats: {
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      marginBottom: '20px',
      padding: '16px',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '8px',
      border: `1px solid ${theme === 'dark' ? '#2a4a6e' : '#ddd'}`
    },
    statItem: {
      flex: 1,
      minWidth: '120px'
    },
    statLabel: {
      fontSize: '12px',
      color: 'var(--text-secondary)'
    },
    statValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1877f2'
    },
    weightLoss: {
      color: '#4caf50'
    },
    weightGain: {
      color: '#f44336'
    }
  };

  if (loading) {
    return <div style={styles.loadingText}>Loading members...</div>;
  }

  const stats = getProgressStats();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📈 Member Progress Tracking</h2>
      
      <select
        onChange={e => {
          const member = members.find(m => getMemberId(m) === e.target.value);
          setSelectedMember(member);
        }}
        style={styles.select}
        value={selectedMember ? getMemberId(selectedMember) : ''}
      >
        <option value="">-- Select a member --</option>
        {members.map(m => (
          <option key={getMemberId(m)} value={getMemberId(m)}>
            {m.name || m.email || 'Member'}
          </option>
        ))}
      </select>

      {selectedMember && (
        <>
          <h3 style={styles.memberName}>
            Progress for {selectedMember.name || selectedMember.email}
          </h3>
          
          {entries.length === 0 ? (
            <p style={styles.emptyText}>No progress entries yet for this member.</p>
          ) : (
            <>
              {/* Progress Stats Cards */}
              {stats && (
                <div style={styles.progressStats}>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Starting Weight</div>
                    <div style={styles.statValue}>{stats.startWeight} kg</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Current Weight</div>
                    <div style={styles.statValue}>{stats.currentWeight} kg</div>
                  </div>
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Weight Change</div>
                    <div style={{
                      ...styles.statValue,
                      ...(stats.weightChange < 0 ? styles.weightLoss : stats.weightChange > 0 ? styles.weightGain : {})
                    }}>
                      {stats.weightChange > 0 ? '+' : ''}{stats.weightChange} kg
                      <span style={{ fontSize: '14px', marginLeft: '4px' }}>
                        ({stats.weightChange > 0 ? '↑' : stats.weightChange < 0 ? '↓' : '→'})
                      </span>
                    </div>
                  </div>
                  {stats.startBodyFat && stats.currentBodyFat && (
                    <div style={styles.statItem}>
                      <div style={styles.statLabel}>Body Fat</div>
                      <div style={styles.statValue}>
                        {stats.startBodyFat}% → {stats.currentBodyFat}%
                      </div>
                    </div>
                  )}
                  <div style={styles.statItem}>
                    <div style={styles.statLabel}>Total Entries</div>
                    <div style={styles.statValue}>{stats.totalEntries}</div>
                  </div>
                </div>
              )}
              
              {/* Chart */}
              <div style={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#444' : '#ddd'} />
                    <XAxis 
                      dataKey="date" 
                      stroke={theme === 'dark' ? '#ccc' : '#333'}
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke={theme === 'dark' ? '#ccc' : '#333'}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1e2a3a' : 'white', 
                        borderColor: theme === 'dark' ? '#444' : '#ddd',
                        color: theme === 'dark' ? '#eee' : '#333'
                      }} 
                    />
                    <Legend wrapperStyle={{ color: theme === 'dark' ? '#eee' : '#333' }} />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#1877f2" 
                      strokeWidth={2} 
                      name="Weight (kg)" 
                      dot={{ r: 4 }} 
                    />
                    {chartData.some(d => d.bodyFat) && (
                      <Line 
                        type="monotone" 
                        dataKey="bodyFat" 
                        stroke="#4caf50" 
                        strokeWidth={2} 
                        name="Body Fat %" 
                        dot={{ r: 4 }} 
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* All Entries - Card layout (already mobile-friendly) */}
              <h3 style={{ color: 'var(--text-primary)', marginTop: '24px' }}>All Entries</h3>
              <div style={styles.entriesContainer}>
                {entries.map(entry => (
                  <div key={entry.id || entry._id} style={styles.entryCard}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                      📅 {new Date(entry.date).toLocaleDateString()}
                    </div>
                    <div>⚖️ Weight: <strong>{entry.weight} kg</strong></div>
                    {entry.bodyFat && <div>🎯 Body Fat: <strong>{entry.bodyFat}%</strong></div>}
                    {entry.notes && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        📝 {entry.notes}
                      </div>
                    )}
                    {entry.createdByName && (
                      <div style={{ fontSize: '11px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                        👤 Recorded by: {entry.createdByName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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