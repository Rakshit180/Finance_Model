import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';

export default function BudgetSimulatorView({ user, transactions, onUpdateUser, awardXP }) {
  const [budgetVal, setBudgetVal] = useState(user.targetBudget || 15000);
  const [phonePrice, setPhonePrice] = useState(80000); // One-time expense simulation
  const [monthlySavingAction, setMonthlySavingAction] = useState(3000); // Monthly cutback savings
  const [simMonth, setSimMonth] = useState(3); // When to make the purchase (Month 3)

  // Calculations for recommendation engine
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthExpenses = transactions
    .filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'expense';
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Suggest budget based on actual expenses plus 10% safety buffer
  const suggestedBudget = currentMonthExpenses > 0 
    ? Math.round(currentMonthExpenses * 1.1) 
    : (user.userType === 'Student' ? 12000 : 35000);

  const handleSaveBudget = async () => {
    const updated = { ...user, targetBudget: parseFloat(budgetVal) };
    await onUpdateUser(updated);
    await awardXP(10);
    alert(`Budget limit updated to ₹${budgetVal}! Awarded +10 XP.`);
  };

  const handleApplySuggestion = async () => {
    setBudgetVal(suggestedBudget);
    const updated = { ...user, targetBudget: suggestedBudget };
    await onUpdateUser(updated);
    await awardXP(15);
    alert(`Recommended budget limit of ₹${suggestedBudget} applied! Awarded +15 XP.`);
  };

  // Future simulation logic
  // Assume a baseline savings rate.
  // If Student: assume baseline monthly savings = ₹2,000. If Professional: assume baseline monthly savings = ₹12,000.
  const baselineMonthlySaving = user.userType === 'Student' ? 3000 : 15000;
  
  const months = ["Now", "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12"];
  
  // Compute savings over 12 months
  const baselineSavings = [];
  const simulatedSavings = [];
  
  let currentBase = 0;
  let currentSim = 0;
  
  for (let i = 0; i <= 12; i++) {
    if (i === 0) {
      baselineSavings.push(0);
      simulatedSavings.push(0);
    } else {
      currentBase += baselineMonthlySaving;
      
      // Simulated: add savings from monthly cutback, and deduct one-time purchase at specified month
      let simulatedMonthlyChange = baselineMonthlySaving + monthlySavingAction;
      currentSim += simulatedMonthlyChange;
      
      if (i === simMonth) {
        currentSim -= phonePrice;
      }
      
      baselineSavings.push(currentBase);
      simulatedSavings.push(currentSim);
    }
  }

  // Render SVG Line Chart logic
  // SVG size: width 500, height 240. Padding left 60, padding right 20, padding top 20, padding bottom 30.
  const svgW = 500;
  const svgH = 220;
  const padL = 60;
  const padR = 20;
  const padT = 20;
  const padB = 30;

  // Max value for scaling
  const maxVal = Math.max(...baselineSavings, ...simulatedSavings, 10000);
  
  // Coordinate helpers
  const getX = (index) => padL + (index * (svgW - padL - padR) / 12);
  const getY = (val) => svgH - padB - ((val / maxVal) * (svgH - padT - padB));

  // Build points strings for SVG polyline
  const baselinePoints = baselineSavings.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
  const simulatedPoints = simulatedSavings.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');

  return (
    <div className="dashboard-grid">
      
      {/* Budget Settings & Recommendation */}
      <div className="col-6 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '18px' }}>Auto-Budgeting limits</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Configure Monthly Target Budget Limit (₹)</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="number"
              value={budgetVal}
              onChange={(e) => setBudgetVal(e.target.value)}
              className="glass-input"
              style={{ flexGrow: 1 }}
            />
            <button onClick={handleSaveBudget} className="glass-btn">
              Update Goal
            </button>
          </div>
        </div>

        <div 
          className="glass-panel" 
          style={{ 
            padding: '16px', 
            background: 'var(--color-primary-glow)', 
            borderColor: 'var(--color-primary)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
            <Sparkles size={16} color="var(--color-warning)" />
            AI Budget Recommendation Engine
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            We've analyzed your actual expenses for this month (currently ₹{currentMonthExpenses.toLocaleString()}). 
            The system suggests a healthy monthly budget limit of **₹{suggestedBudget.toLocaleString()}** (including a 10% safety buffer).
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#fff', fontWeight: '500' }}>
            <span>Recommended limit: ₹{suggestedBudget.toLocaleString()}</span>
            <button 
              onClick={handleApplySuggestion}
              style={{ background: '#fff', color: 'var(--color-primary)', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Apply Suggestion (+15 XP)
            </button>
          </div>
        </div>

        <div style={{ fontSize: '13px' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Suggested Category Envelopes:</h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px' }}>
            {user.userType === 'Student' ? (
              <>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Mess / Food (35%)</span><strong>₹{Math.round(budgetVal * 0.35)}</strong></li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Hostel Fee / Rent (40%)</span><strong>₹{Math.round(budgetVal * 0.40)}</strong></li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Recreation & Shopping (15%)</span><strong>₹{Math.round(budgetVal * 0.15)}</strong></li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Miscellaneous (10%)</span><strong>₹{Math.round(budgetVal * 0.10)}</strong></li>
              </>
            ) : (
              <>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Housing Rent / EMI (30%)</span><strong>₹{Math.round(budgetVal * 0.30)}</strong></li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Groceries / Living (25%)</span><strong>₹{Math.round(budgetVal * 0.25)}</strong></li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Investment & Savings (25%)</span><strong>₹{Math.round(budgetVal * 0.25)}</strong></li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}><span>Entertainment & Dining (20%)</span><strong>₹{Math.round(budgetVal * 0.20)}</strong></li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Future Simulation Engine */}
      <div className="col-6 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '18px' }}>Future Simulation Engine</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Simulate how purchase decisions and monthly saving adjustments affect your cumulative savings over 12 months.
        </p>

        {/* Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Slider 1: One-time expense */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>One-Time Big Purchase (e.g. iPhone)</span>
              <strong style={{ color: 'var(--color-danger)' }}>₹{phonePrice.toLocaleString()}</strong>
            </div>
            <input 
              type="range" 
              min="10000" 
              max="150000" 
              step="5000"
              value={phonePrice}
              onChange={(e) => setPhonePrice(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-danger)' }}
            />
          </div>

          {/* Slider 2: Monthly cutback */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Monthly Cutback Action (e.g. Stop eating out)</span>
              <strong style={{ color: 'var(--color-success)' }}>+₹{monthlySavingAction.toLocaleString()}/mo</strong>
            </div>
            <input 
              type="range" 
              min="0" 
              max="10000" 
              step="500"
              value={monthlySavingAction}
              onChange={(e) => setMonthlySavingAction(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-success)' }}
            />
          </div>

          {/* Slider 3: Purchase Month */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Purchase Month</span>
              <strong style={{ color: 'var(--color-primary)' }}>Month {simMonth}</strong>
            </div>
            <input 
              type="range" 
              min="1" 
              max="12" 
              value={simMonth}
              onChange={(e) => setSimMonth(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-primary)' }}
            />
          </div>

        </div>

        {/* Projections Graph - SVG Custom Line Chart */}
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
          <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>
            {/* Grid Lines */}
            <line x1={padL} y1={getY(0)} x2={svgW - padR} y2={getY(0)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <line x1={padL} y1={getY(maxVal / 2)} x2={svgW - padR} y2={getY(maxVal / 2)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <line x1={padL} y1={getY(maxVal)} x2={svgW - padR} y2={getY(maxVal)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            
            {/* Y Axis Labels */}
            <text x={padL - 10} y={getY(0) + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">₹0</text>
            <text x={padL - 10} y={getY(maxVal / 2) + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">₹{Math.round(maxVal / 2000) * 1000}</text>
            <text x={padL - 10} y={getY(maxVal) + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">₹{Math.round(maxVal / 1000) * 1000}</text>

            {/* Baseline Polyline (Dashed white/gray) */}
            <polyline
              fill="none"
              stroke="#6b7280"
              strokeWidth="2"
              strokeDasharray="4"
              points={baselinePoints}
            />

            {/* Simulated Polyline (Purple glow) */}
            <polyline
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="3.5"
              points={simulatedPoints}
              style={{ filter: 'drop-shadow(0 0 4px var(--color-primary-glow))' }}
            />

            {/* Month Dots / Labels */}
            {months.map((m, i) => (
              <g key={i}>
                <text x={getX(i)} y={svgH - 10} fill="var(--text-muted)" fontSize="9" textAnchor="middle">{m}</text>
                {/* Highlight purchase dot */}
                {i === simMonth && (
                  <circle cx={getX(i)} cy={getY(simulatedSavings[i])} r="5" fill="var(--color-danger)" />
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Results assessment text */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '3px', borderTop: '2px dashed #6b7280' }} />
            Baseline Savings (₹{baselineSavings[12].toLocaleString()})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '3px', background: 'var(--color-primary)' }} />
            Simulated Savings (₹{simulatedSavings[12].toLocaleString()})
          </div>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          {simulatedSavings[12] >= baselineSavings[12] ? (
            <p>
              🌟 **Awesome!** By saving ₹{monthlySavingAction.toLocaleString()}/mo, you easily offset the cost of your ₹{phonePrice.toLocaleString()} purchase! 
              At the end of 12 months, you will have **₹{simulatedSavings[12].toLocaleString()}** in savings, which is **₹{(simulatedSavings[12] - baselineSavings[12]).toLocaleString()} more** than baseline!
            </p>
          ) : (
            <p>
              ⚠️ **Warning:** Your purchase of ₹{phonePrice.toLocaleString()} leaves you with **₹{(baselineSavings[12] - simulatedSavings[12]).toLocaleString()} less** in total savings compared to baseline. 
              Consider increasing your monthly cutback action to offset the cost!
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
