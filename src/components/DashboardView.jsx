import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  AlertTriangle,
  Calendar,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Plus
} from 'lucide-react';
import { db } from '../utils/db';

export default function DashboardView({ user, transactions, onRefreshTransactions }) {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [missingDays, setMissingDays] = useState([]);
  const [quickLogOpen, setQuickLogOpen] = useState(null); // stores date to quick log

  // Calculate statistics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = thisMonthTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = thisMonthTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;

  // 1. Calculate Health Score
  // Saving rate
  const savingRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  // Budget discipline
  const budgetLimit = user.targetBudget || 15000;
  const budgetUtilization = (totalExpense / budgetLimit) * 100;
  const budgetDiscipline = Math.max(0, 100 - Math.max(0, budgetUtilization - 100));
  // Expense ratio
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  // Formula: 40% saving rate, 40% budget discipline, 20% low expense ratio
  const healthScoreRaw = (Math.max(0, savingRate) * 0.4) + (budgetDiscipline * 0.4) + (Math.max(0, 100 - expenseRatio) * 0.2);
  const healthScore = Math.min(100, Math.round(healthScoreRaw || 0));

  // Determine pet emotion
  let petEmotion = 'neutral';
  let petQuote = "We're doing okay, keep tracking those transactions.";
  let petColor = 'var(--color-primary)';
  
  if (healthScore >= 80) {
    petEmotion = 'happy';
    petQuote = `You're a financial legend! My belly is full of savings! Let's build our city!`;
    petColor = 'var(--color-success)';
  } else if (healthScore >= 50) {
    petEmotion = 'neutral';
    petQuote = `We're on track, but let's keep our eyes on the savings goals!`;
    petColor = 'var(--color-primary)';
  } else if (healthScore >= 20) {
    petEmotion = 'sleepy';
    petQuote = `I'm feeling a bit weak... Can we cut down on some laziness expenses?`;
    petColor = 'var(--color-warning)';
  } else {
    petEmotion = 'panicked';
    petQuote = `ALERT! Budget blown! We need emergency savings immediately! Help!`;
    petColor = 'var(--color-danger)';
  }

  // 2. Generate dynamic alerts
  useEffect(() => {
    const alerts = [];
    if (totalExpense > budgetLimit) {
      alerts.push({
        type: 'danger',
        message: `Budget blown! You exceeded your limit of ₹${budgetLimit} by ₹${Math.round(totalExpense - budgetLimit)}.`
      });
    } else if (totalExpense >= budgetLimit * 0.9) {
      alerts.push({
        type: 'warning',
        message: `Critial Alert: Monthly spending has reached 90% of your ₹${budgetLimit} budget.`
      });
    } else if (totalExpense >= budgetLimit * 0.75) {
      alerts.push({
        type: 'info',
        message: `Alert: Spent 75% of your target budget. Slow down spending.`
      });
    }

    // Category check (Food)
    const foodExpenses = thisMonthTx
      .filter(t => t.type === 'expense' && t.category.toLowerCase() === 'food')
      .reduce((sum, t) => sum + t.amount, 0);

    const foodBudget = budgetLimit * 0.3; // Allow 30% for food
    if (foodExpenses > foodBudget) {
      alerts.push({
        type: 'warning',
        message: `Food budget exceeded! Spent ₹${Math.round(foodExpenses)} (limit: ₹${Math.round(foodBudget)}).`
      });
    }

    // Role-based advice
    if (user.userType === 'Student') {
      alerts.push({
        type: 'info',
        message: "Student tip: Watch out for weekend recreation & hostel delivery. Every rupee saved adds XP!"
      });
    } else {
      alerts.push({
        type: 'info',
        message: "Professional tip: Check your tax planning items. Consider increasing investments to save tax."
      });
    }

    setActiveAlerts(alerts);
  }, [totalExpense, budgetLimit, user.userType, transactions]);

  // 3. Heatmap calendar data (last 28 days)
  const heatmapDays = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const spentOnDay = transactions
      .filter(t => t.type === 'expense' && t.date === dateStr)
      .reduce((sum, t) => sum + t.amount, 0);

    const dailyLimit = budgetLimit / 30;
    let lvl = 0;
    if (spentOnDay > 0) {
      if (spentOnDay <= dailyLimit) lvl = 1;      // Low spending (Green)
      else if (spentOnDay <= dailyLimit * 2) lvl = 2; // Medium (Yellow)
      else lvl = 3;                                // High (Red)
    }

    heatmapDays.push({
      date: dateStr,
      displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      amount: spentOnDay,
      level: lvl
    });
  }

  // 4. Missing Day Recovery logic
  useEffect(() => {
    const missing = [];
    const checkDaysCount = 5; // Check last 5 days
    for (let i = 1; i <= checkDaysCount; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const hasTx = transactions.some(t => t.date === dateStr);
      if (!hasTx) {
        missing.push({
          date: dateStr,
          dayName: d.toLocaleDateString(undefined, { weekday: 'long' }),
          displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        });
      }
    }
    setMissingDays(missing);
  }, [transactions]);

  const handleQuickLog = async (date, category, amountVal) => {
    const amount = parseFloat(amountVal);
    if (isNaN(amount) || amount <= 0) return;

    const newTx = {
      id: `${user.id}-${Date.now()}`,
      userId: user.id,
      type: 'expense',
      category,
      amount,
      date,
      reason: 'necessity', // default
      isSubscription: false,
      title: `Quick ${category}`
    };

    await db.transactions.put(newTx);
    onRefreshTransactions();
    setQuickLogOpen(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Upper Header Welcome */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Hello, {user.username}!</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Financial personality: <strong style={{ color: 'var(--color-primary)' }}>{user.moneyDna}</strong> • Account: <strong>{user.userType}</strong>
          </p>
        </div>
        <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--color-warning)" />
          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Creature: {user.creatureName}</span>
        </div>
      </div>

      {/* Main Grid: Creature, Gauges and Alerts */}
      <div className="dashboard-grid">
        
        {/* KPI Cards */}
        <div className="col-4 glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'var(--color-success-glow)', color: 'var(--color-success)', borderRadius: '12px' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>THIS MONTH INCOME</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>₹{totalIncome.toLocaleString()}</div>
          </div>
        </div>

        <div className="col-4 glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'var(--color-danger-glow)', color: 'var(--color-danger)', borderRadius: '12px' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>THIS MONTH EXPENSES</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>₹{totalExpense.toLocaleString()}</div>
          </div>
        </div>

        <div className="col-4 glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'var(--color-primary-glow)', color: 'var(--color-primary)', borderRadius: '12px' }}>
            <PiggyBank size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>MONTHLY NET SAVINGS</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px', color: netSavings >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              ₹{netSavings.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Creature Box */}
        <div className="col-4 glass-panel pet-container" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Discipline Companion</h3>
          
          <div className="speech-bubble">
            "{petQuote}"
          </div>

          {/* Dynamic Animated Creature Pet */}
          <svg className="pet-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Body */}
            <circle cx="50" cy="55" r="30" fill={petColor} opacity="0.8" />
            <ellipse cx="50" cy="58" rx="22" ry="24" fill={petColor} />
            
            {/* Face/Eyes based on status */}
            {petEmotion === 'happy' && (
              <>
                {/* Happy arcs for eyes */}
                <path d="M38 48 C 38 43, 44 43, 44 48" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M56 48 C 56 43, 62 43, 62 48" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                {/* Rosy cheeks */}
                <ellipse cx="32" cy="55" rx="4" ry="2" fill="#f472b6" />
                <ellipse cx="68" cy="55" rx="4" ry="2" fill="#f472b6" />
                {/* Big happy mouth */}
                <path d="M44 60 Q 50 66, 56 60" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </>
            )}
            
            {petEmotion === 'neutral' && (
              <>
                {/* Normal dot eyes */}
                <circle cx="40" cy="48" r="3.5" fill="#000" />
                <circle cx="60" cy="48" r="3.5" fill="#000" />
                {/* Smiley line */}
                <path d="M46 62 Q 50 64, 54 62" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </>
            )}

            {petEmotion === 'sleepy' && (
              <>
                {/* Flat sleepy eyes */}
                <line x1="36" y1="48" x2="44" y2="48" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="56" y1="48" x2="64" y2="48" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                {/* Small o mouth */}
                <circle cx="50" cy="62" r="3" fill="#000" />
              </>
            )}

            {petEmotion === 'panicked' && (
              <>
                {/* Shocked open eyes */}
                <circle cx="40" cy="46" r="5" fill="#fff" stroke="#000" strokeWidth="1.5" />
                <circle cx="40" cy="46" r="2" fill="#000" />
                <circle cx="60" cy="46" r="5" fill="#fff" stroke="#000" strokeWidth="1.5" />
                <circle cx="60" cy="46" r="2" fill="#000" />
                {/* Sad face mouth */}
                <path d="M44 64 Q 50 58, 56 64" stroke="#000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Tears */}
                <path d="M38 52 L 38 60" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                <path d="M62 52 L 62 60" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
              </>
            )}
            
            {/* Cute antenna or horn */}
            <path d="M50 25 L 50 15" stroke={petColor} strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="50" cy="12" r="3" fill={petColor} />
          </svg>
        </div>

        {/* Health Score Gauge */}
        <div className="col-4 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-secondary)', alignSelf: 'flex-start' }}>Financial Health Score</h3>
          
          <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="150" height="150" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              {/* Progress gauge */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                fill="none" 
                stroke={petColor} 
                strokeWidth="10" 
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthScore / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>{healthScore}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <div>Save Rate: <strong>{Math.round(savingRate)}%</strong></div>
            <div>Discipline: <strong>{Math.round(budgetDiscipline)}%</strong></div>
          </div>
        </div>

        {/* Heatmap calendar */}
        <div className="col-4 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Expense Heatmap</h3>
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="heatmap-grid">
              {heatmapDays.map((day, i) => (
                <div 
                  key={i} 
                  className={`heatmap-cell heatmap-lvl-${day.level}`}
                  data-tooltip={`${day.displayDate}: ₹${day.amount.toLocaleString()}`}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px', fontSize: '9px', color: 'var(--text-muted)' }}>
            <span>Less</span>
            <div style={{ width: '10px', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }} />
            <div style={{ width: '10px', height: '10px', background: 'rgba(16, 185, 129, 0.3)', borderRadius: '2px' }} />
            <div style={{ width: '10px', height: '10px', background: 'rgba(245, 158, 11, 0.5)', borderRadius: '2px' }} />
            <div style={{ width: '10px', height: '10px', background: 'rgba(239, 68, 68, 0.7)', borderRadius: '2px' }} />
            <span>More</span>
          </div>
        </div>

        {/* Dynamic Alerts */}
        <div className="col-8 glass-panel" style={{ padding: '24px', minHeight: '200px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Smart Alerts & Recommendations</h3>
          {activeAlerts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', color: 'var(--text-muted)' }}>
              <CheckCircle size={32} style={{ marginBottom: '8px', color: 'var(--color-success)' }} />
              <p>Everything looks perfect! No alerts active.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeAlerts.map((alert, i) => (
                <div 
                  key={i} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: alert.type === 'danger' ? 'var(--color-danger-glow)' : alert.type === 'warning' ? 'var(--color-warning-glow)' : 'rgba(255,255,255,0.03)',
                    border: '1px solid',
                    borderColor: alert.type === 'danger' ? 'var(--color-danger)' : alert.type === 'warning' ? 'var(--color-warning)' : 'var(--border-glass)',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                >
                  <AlertTriangle size={18} color={alert.type === 'danger' ? 'var(--color-danger)' : alert.type === 'warning' ? 'var(--color-warning)' : 'var(--color-info)'} />
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Missing Day Recovery */}
        <div className="col-4 glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Missing Day Recovery</h3>
          {missingDays.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
              Awesome! You've logged transactions every day recently. Keep it up!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No transactions logged on these days. Did you spend money?</p>
              {missingDays.slice(0, 2).map((day, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{day.dayName}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{day.displayDate}</div>
                  </div>
                  {quickLogOpen === day.date ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input 
                        type="number" 
                        placeholder="Amt" 
                        id={`quick-amt-${i}`}
                        className="glass-input" 
                        style={{ width: '60px', padding: '4px 8px', fontSize: '11px' }}
                      />
                      <select 
                        id={`quick-cat-${i}`}
                        className="glass-input" 
                        style={{ width: '70px', padding: '4px 8px', fontSize: '11px' }}
                      >
                        <option value="food">Food</option>
                        <option value="transport">Transport</option>
                        <option value="entertainment">Entert.</option>
                        <option value="utilities">Utilities</option>
                      </select>
                      <button 
                        className="glass-btn" 
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => {
                          const amt = document.getElementById(`quick-amt-${i}`).value;
                          const cat = document.getElementById(`quick-cat-${i}`).value;
                          handleQuickLog(day.date, cat, amt);
                        }}
                      >
                        Log
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="glass-btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                      onClick={() => setQuickLogOpen(day.date)}
                    >
                      <Plus size={10} /> Recovery Log
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
