import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { Award, CheckCircle, Plus, Trash2, Users, Trophy } from 'lucide-react';

export default function GamificationView({ user, transactions, onUpdateUser, awardXP }) {
  const [challenges, setChallenges] = useState([]);
  const [roommates, setRoommates] = useState(['Rahul', 'Sneha']);
  const [newRoommateName, setNewRoommateName] = useState('');
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [payer, setPayer] = useState('Rahul');
  const [debts, setDebts] = useState([]);

  // Load challenges
  const fetchChallenges = async () => {
    const list = await db.challenges.getByUser(user.id);
    setChallenges(list);
  };

  // Load roommate split state
  const fetchSplits = async () => {
    const list = await db.splits.getByUser(user.id);
    setDebts(list);
  };

  useEffect(() => {
    fetchChallenges();
    fetchSplits();
  }, [user.id]);

  // Badge unlock checks
  const totalTxCount = transactions.length;
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const badges = [
    { id: 1, name: "First Step", desc: "Logged 1+ transactions", unlocked: totalTxCount >= 1 },
    { id: 2, name: "Frugal Master", desc: "Logged 5+ tx & expenses < 80% budget", unlocked: totalTxCount >= 5 && totalExpenses < (user.targetBudget * 0.8) },
    { id: 3, name: "Saver Ninja", desc: "Saving rate above 30%", unlocked: savingRate >= 30 },
    { id: 4, name: "Split Master", desc: "Logged roommate splits", unlocked: debts.length > 0 }
  ];

  // Challenge check-in logic
  const handleCheckIn = async (cId) => {
    const updated = challenges.map(c => {
      if (c.id === cId) {
        const nextDayIndex = c.progressDays.indexOf(false);
        if (nextDayIndex !== -1) {
          c.progressDays[nextDayIndex] = true;
          // If this was the last day, mark completed
          if (nextDayIndex === c.durationDays - 1) {
            c.completed = true;
          }
        }
      }
      return c;
    });

    const targetC = updated.find(c => c.id === cId);
    await db.challenges.put(targetC);
    setChallenges(updated);
  };

  const handleClaimReward = async (cId, rewardXp) => {
    const targetC = challenges.find(c => c.id === cId);
    // Delete or mark inactive
    targetC.active = false;
    await db.challenges.put(targetC);
    await awardXP(rewardXp);
    alert(`Reward Claimed! +${rewardXp} XP added to profile.`);
    fetchChallenges();
  };

  const handleAddRoommate = (e) => {
    e.preventDefault();
    if (!newRoommateName.trim() || roommates.includes(newRoommateName.trim())) return;
    setRoommates([...roommates, newRoommateName.trim()]);
    setNewRoommateName('');
  };

  const handleAddSplit = async (e) => {
    e.preventDefault();
    if (!billTitle.trim() || !billAmount) return;

    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0 || roommates.length === 0) return;

    // Split equally among user + roommates
    const divisor = roommates.length + 1; // roommates + you
    const share = amount / divisor;

    // Generate debts list
    // If payer is 'You', roommates owe you. If payer is roommate, you owe them.
    const newSplits = [];
    if (payer === 'You') {
      roommates.forEach(name => {
        newSplits.push({
          id: `${user.id}-split-${Date.now()}-${name}`,
          userId: user.id,
          debtor: name,
          creditor: 'You',
          amount: share,
          title: billTitle
        });
      });
    } else {
      // Payer is roommate. You owe them. Others owe them (ignored for simplified personal tracking).
      newSplits.push({
        id: `${user.id}-split-${Date.now()}-${payer}`,
        userId: user.id,
        debtor: 'You',
        creditor: payer,
        amount: share,
        title: billTitle
      });
    }

    for (const split of newSplits) {
      await db.splits.put(split);
    }
    
    await awardXP(10); // Reward for using roommate economy
    setBillTitle('');
    setBillAmount('');
    fetchSplits();
  };

  const handleSettleSplit = async (splitId) => {
    await db.splits.delete(splitId);
    fetchSplits();
  };

  // Leaderboard statistics (savings rate percentage)
  // Calculate user's actual saving percentage this month
  const userSavingPercent = Math.max(0, Math.round(savingRate));

  const leaderboard = [
    { rank: 1, name: "Priya (Fear Saver)", percent: 75, avatar: "PR" },
    { rank: 2, name: "Rahul (Weekend Destroyer)", percent: 45, avatar: "RA" },
    { rank: 3, name: user.username + " (You)", percent: userSavingPercent, avatar: "ME", isMe: true },
    { rank: 4, name: "Vikram (Impulse Hunter)", percent: 20, avatar: "VI" }
  ];

  // Sort leaderboard by percent descending, and update ranks
  leaderboard.sort((a, b) => b.percent - a.percent);
  leaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  return (
    <div className="dashboard-grid">
      
      {/* Level & Badge Locker */}
      <div className="col-4 glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>FinQuest Badges</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Complete milestones to unlock achievements.
        </p>

        <div className="badge-grid">
          {badges.map((badge) => (
            <div 
              key={badge.id} 
              className={`badge-item ${badge.unlocked ? 'unlocked' : ''}`}
              title={badge.desc}
            >
              <Award size={28} />
              <strong style={{ fontSize: '10px' }}>{badge.name}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard only percentage */}
      <div className="col-4 glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Trophy size={20} color="var(--color-warning)" />
          <h2 style={{ fontSize: '18px' }}>Campus Leaderboard</h2>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Compete on monthly savings percentage:
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {leaderboard.map((item, index) => (
            <div 
              key={index} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '10px 12px', 
                background: item.isMe ? 'var(--color-primary-glow)' : 'rgba(255,255,255,0.02)', 
                border: '1px solid',
                borderColor: item.isMe ? 'var(--color-primary)' : 'var(--border-glass)',
                borderRadius: '8px'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 'bold', width: '20px', color: index === 0 ? 'var(--color-warning)' : 'var(--text-secondary)' }}>
                #{item.rank}
              </span>
              <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)' }}>
                {item.avatar}
              </div>
              <span style={{ fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>
                {item.name}
              </span>
              <strong style={{ fontSize: '13px', color: 'var(--color-success)' }}>
                {item.percent}%
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* Challenges list */}
      <div className="col-4 glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Saving Challenges</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {challenges.filter(c => c.active).length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
              No active challenges. Level up to unlock more!
            </div>
          ) : (
            challenges.filter(c => c.active).map((c) => {
              const currentProgress = c.progressDays.filter(Boolean).length;
              return (
                <div key={c.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '13px' }}>{c.challengeName}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--color-warning)' }}>+{c.xpReward} XP</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    {c.progressDays.map((checked, i) => (
                      <div 
                        key={i} 
                        style={{ 
                          height: '6px', 
                          flexGrow: 1, 
                          background: checked ? 'var(--color-success)' : 'rgba(255,255,255,0.1)',
                          borderRadius: '3px'
                        }} 
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Progress: {currentProgress}/{c.durationDays} Days</span>
                    
                    {c.completed ? (
                      <button 
                        onClick={() => handleClaimReward(c.id, c.xpReward)}
                        className="glass-btn" 
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        Claim Reward
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleCheckIn(c.id)}
                        className="glass-btn-secondary" 
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                        disabled={c.progressDays[currentProgress] === true}
                      >
                        Check-in Today
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Roommate Splitter */}
      <div className="col-8 glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Users size={20} color="var(--color-info)" />
          <h2 style={{ fontSize: '18px' }}>Roommate Economy Splitting</h2>
        </div>
        
        <div className="dashboard-grid">
          {/* Add roommates and split form */}
          <div className="col-6" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Manage Roommates */}
            <form onSubmit={handleAddRoommate} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Add Roommates</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Roommate Name"
                  value={newRoommateName}
                  onChange={(e) => setNewRoommateName(e.target.value)}
                  className="glass-input"
                  style={{ flexGrow: 1, padding: '8px 12px' }}
                />
                <button type="submit" className="glass-btn-secondary" style={{ padding: '8px 12px' }}>Add</button>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {roommates.map((name, i) => (
                  <span 
                    key={i} 
                    style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '4px', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {name}
                    <button type="button" onClick={() => setRoommates(roommates.filter(r => r !== name))} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>×</button>
                  </span>
                ))}
              </div>
            </form>

            {/* Split bill form */}
            <form onSubmit={handleAddSplit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Add Shared Bill</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input 
                  type="text" 
                  placeholder="e.g. WiFi Bill"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  className="glass-input"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="number" 
                  placeholder="Total Amount (₹)"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="glass-input"
                  style={{ flexGrow: 1 }}
                  required
                />
                <select 
                  value={payer} 
                  onChange={(e) => setPayer(e.target.value)}
                  className="glass-input"
                >
                  <option value="You">Paid by You</option>
                  {roommates.map((name, i) => (
                    <option key={i} value={name}>Paid by {name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="glass-btn">
                Split Equally (+10 XP)
              </button>
            </form>
          </div>

          {/* Debts panel */}
          <div className="col-6" style={{ borderLeft: '1px solid var(--border-glass)', paddingLeft: '20px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Split Balances</h4>
            {debts.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '40px 0' }}>
                No active debts or split transactions.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
                {debts.map((debt) => (
                  <div 
                    key={debt.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      background: 'rgba(0,0,0,0.1)', 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      border: '1px solid var(--border-glass)' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{debt.title}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {debt.debtor === 'You' ? (
                          <span>You owe <strong style={{ color: 'var(--color-danger)' }}>{debt.creditor}</strong></span>
                        ) : (
                          <span><strong>{debt.debtor}</strong> owes you</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <strong style={{ fontSize: '13px', color: debt.debtor === 'You' ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        ₹{Math.round(debt.amount)}
                      </strong>
                      <button 
                        onClick={() => handleSettleSplit(debt.id)}
                        className="glass-btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '10px' }}
                      >
                        Settle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
