import React from 'react';

// SVG Building Assets
const BankBuilding = () => (
  <svg className="building-svg" viewBox="0 0 40 40">
    <path d="M5 35 L35 35 L35 32 L5 32 Z" fill="#475569" />
    <path d="M8 32 L8 18 L12 18 L12 32 Z" fill="#64748b" />
    <path d="M18 32 L18 18 L22 18 L22 32 Z" fill="#64748b" />
    <path d="M28 32 L28 18 L32 18 L32 32 Z" fill="#64748b" />
    <path d="M4 18 L36 18 L20 8 Z" fill="#f59e0b" />
    <text x="20" y="15" fill="#000" fontSize="5" fontWeight="bold" textAnchor="middle">₹</text>
  </svg>
);

const RestaurantBuilding = () => (
  <svg className="building-svg" viewBox="0 0 40 40">
    <rect x="6" y="14" width="28" height="21" rx="2" fill="#ef4444" opacity="0.9" />
    <path d="M4 14 L36 14 L33 9 L7 9 Z" fill="#f87171" />
    <rect x="14" y="24" width="12" height="11" fill="#fee2e2" />
    <circle cx="16" cy="29" r="1.5" fill="#000" />
    <rect x="23" y="17" width="6" height="5" fill="#fee2e2" />
    <text x="20" y="7" fill="#fff" fontSize="5" textAnchor="middle">CAFE</text>
  </svg>
);

const TransportBuilding = () => (
  <svg className="building-svg" viewBox="0 0 40 40">
    <rect x="8" y="18" width="24" height="17" rx="3" fill="#0ea5e9" />
    <rect x="11" y="21" width="6" height="6" rx="1" fill="#e0f2fe" />
    <rect x="23" y="21" width="6" height="6" rx="1" fill="#e0f2fe" />
    <circle cx="14" cy="35" r="3" fill="#334155" />
    <circle cx="26" cy="35" r="3" fill="#334155" />
    <path d="M5 28 L35 28" stroke="#fff" strokeWidth="2" strokeDasharray="3" />
  </svg>
);

const SchoolBuilding = () => (
  <svg className="building-svg" viewBox="0 0 40 40">
    <rect x="5" y="16" width="30" height="19" fill="#d97706" />
    <polygon points="5,16 20,8 35,16" fill="#b45309" />
    <rect x="17" y="26" width="6" height="9" fill="#1e293b" />
    <circle cx="20" cy="13" r="2.5" fill="#f59e0b" />
    <rect x="9" y="20" width="4" height="4" fill="#fef3c7" />
    <rect x="27" y="20" width="4" height="4" fill="#fef3c7" />
  </svg>
);

const MallBuilding = () => (
  <svg className="building-svg" viewBox="0 0 40 40">
    <rect x="4" y="10" width="32" height="25" rx="3" fill="#8b5cf6" />
    <path d="M4 18 L36 18" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
    <rect x="14" y="23" width="12" height="12" rx="1" fill="#0f172a" />
    <text x="20" y="15" fill="#fff" fontSize="6" fontWeight="bold" textAnchor="middle">MALL</text>
    <rect x="8" y="22" width="4" height="6" fill="#ddd" />
    <rect x="28" y="22" width="4" height="6" fill="#ddd" />
  </svg>
);

const HospitalBuilding = () => (
  <svg className="building-svg" viewBox="0 0 40 40">
    <rect x="7" y="12" width="26" height="23" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
    {/* Red Cross */}
    <rect x="18" y="16" width="4" height="10" fill="#ef4444" />
    <rect x="15" y="19" width="10" height="4" fill="#ef4444" />
    <rect x="15" y="28" width="10" height="7" fill="#334155" />
  </svg>
);

const ParkBuilding = () => (
  <svg className="building-svg" viewBox="0 0 40 40">
    <ellipse cx="20" cy="34" rx="18" ry="4" fill="#15803d" />
    {/* Tree 1 */}
    <rect x="13" y="18" width="3" height="14" fill="#78350f" />
    <circle cx="14.5" cy="16" r="8" fill="#22c55e" />
    {/* Tree 2 */}
    <rect x="25" y="20" width="2.5" height="12" fill="#78350f" />
    <circle cx="26.25" cy="18" r="6" fill="#16a34a" />
  </svg>
);

const CinemaBuilding = () => (
  <svg className="building-svg" viewBox="0 0 40 40">
    <rect x="6" y="12" width="28" height="23" rx="2" fill="#e11d48" />
    <polygon points="12,18 28,18 20,28" fill="#eab308" />
    <text x="20" y="9" fill="#eab308" fontSize="5" fontWeight="bold" textAnchor="middle">★ CINE ★</text>
    <rect x="16" y="29" width="8" height="6" fill="#1e293b" />
  </svg>
);

export default function VirtualCityView({ user, transactions }) {
  // 1. Calculate overall financial health state for weather
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
  const savingRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  const budgetLimit = user.targetBudget || 15000;
  const budgetUtilization = (totalExpense / budgetLimit) * 100;
  const budgetDiscipline = Math.max(0, 100 - Math.max(0, budgetUtilization - 100));
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
  const healthScoreRaw = (Math.max(0, savingRate) * 0.4) + (budgetDiscipline * 0.4) + (Math.max(0, 100 - expenseRatio) * 0.2);
  const healthScore = Math.min(100, Math.round(healthScoreRaw || 0));

  // Determine weather style
  let weatherName = 'Sunny';
  let weatherDesc = 'Clear blue sky reflecting excellent budget discipline!';
  let skyBg = 'linear-gradient(to bottom, #0284c7, #075985, #08090c)';
  let particleClass = 'sun-glow';

  if (healthScore >= 80) {
    weatherName = 'Sunny & Shiny';
    weatherDesc = 'Glorious sunny sky! Your discipline has made the city clean, bright, and vibrant.';
    skyBg = 'linear-gradient(to bottom, #0284c7, #075985, #08090c)';
  } else if (healthScore >= 50) {
    weatherName = 'Partly Cloudy';
    weatherDesc = 'A few clouds drift by. Keep checking your envelopes to clear the sky.';
    skyBg = 'linear-gradient(to bottom, #475569, #1e293b, #08090c)';
  } else if (healthScore >= 20) {
    weatherName = 'Heavy Fog';
    weatherDesc = 'Smoky mist is rolling in. Overspending on wants has clouded the city visibility.';
    skyBg = 'linear-gradient(to bottom, #334155, #0f172a, #030712)';
  } else {
    weatherName = 'Thunderstorm';
    weatherDesc = 'CRITICAL ALERT! Thunder and lightning strike. The budget is completely blown!';
    skyBg = 'linear-gradient(to bottom, #111827, #030712, #000)';
    particleClass = 'lightning-flashes';
  }

  // 2. Scan transactions to determine which buildings exist in our pool
  const buildingsPool = [];

  // Income -> Banks
  const incomeCount = transactions.filter(t => t.type === 'income').length;
  for (let i = 0; i < Math.min(incomeCount, 5); i++) {
    buildingsPool.push({ type: 'bank', component: <BankBuilding /> });
  }

  // Expenses categories
  const expenseCats = transactions.filter(t => t.type === 'expense');
  
  expenseCats.forEach(tx => {
    const catLower = tx.category.toLowerCase();
    if (catLower.includes('food') || catLower.includes('dining') || catLower.includes('mess')) {
      buildingsPool.push({ type: 'restaurant', component: <RestaurantBuilding /> });
    } else if (catLower.includes('transport') || catLower.includes('fuel') || catLower.includes('taxi')) {
      buildingsPool.push({ type: 'transport', component: <TransportBuilding /> });
    } else if (catLower.includes('education') || catLower.includes('books') || catLower.includes('stationery')) {
      buildingsPool.push({ type: 'school', component: <SchoolBuilding /> });
    } else if (catLower.includes('shopping')) {
      buildingsPool.push({ type: 'mall', component: <MallBuilding /> });
    } else if (catLower.includes('health') || catLower.includes('medical') || catLower.includes('pharmacy')) {
      buildingsPool.push({ type: 'hospital', component: <HospitalBuilding /> });
    } else if (catLower.includes('entertainment') || catLower.includes('movie') || catLower.includes('recreation')) {
      buildingsPool.push({ type: 'cinema', component: <CinemaBuilding /> });
    }
  });

  // Net positive savings -> Parks
  if (netSavings > 0) {
    const parkCount = Math.min(Math.ceil(netSavings / 5000), 5); // 1 park per ₹5000 saved
    for (let i = 0; i < parkCount; i++) {
      buildingsPool.push({ type: 'park', component: <ParkBuilding /> });
    }
  }

  // Limit buildings pool to max 36 grid cells
  const finalBuildings = buildingsPool.slice(0, 36);

  // Pad the grid to exactly 36 cells (6x6)
  const gridCells = [];
  for (let i = 0; i < 36; i++) {
    if (finalBuildings[i]) {
      gridCells.push(finalBuildings[i]);
    } else {
      gridCells.push(null); // empty cell
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Your Personal Financial City</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            "Every logged transaction builds a memory block in your virtual layout."
          </p>
        </div>

        {/* Weather Indicator */}
        <div 
          className="glass-panel" 
          style={{ 
            padding: '12px 20px', 
            background: skyBg, 
            border: '1px solid var(--border-glass)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', uppercase: true, letterSpacing: '0.05em' }}>City Weather</span>
          <strong style={{ fontSize: '16px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{weatherName}</strong>
        </div>
      </div>

      <div className="dashboard-grid">
        
        {/* City Voxel Layout Grid (6x6) */}
        <div className="col-8">
          <div 
            className="city-grid"
            style={{ 
              background: skyBg,
              transition: 'background 1s ease'
            }}
          >
            {/* Weather Flashes or Glow overlay */}
            {healthScore < 20 && (
              <div 
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'white',
                  opacity: 0,
                  zIndex: 2,
                  pointerEvents: 'none',
                  animation: 'flash 4s infinite'
                }}
              />
            )}
            
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes flash {
                0%, 95%, 98%, 100% { opacity: 0; }
                96%, 97% { opacity: 0.15; }
              }
            `}} />

            {gridCells.map((cell, index) => (
              <div 
                key={index} 
                className={`city-cell ${cell ? 'occupied' : ''}`}
                style={{ 
                  animationDelay: `${index * 0.05}s`
                }}
              >
                {cell ? cell.component : null}
              </div>
            ))}
          </div>
        </div>

        {/* City Index / Legend */}
        <div className="col-4 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px' }}>City Legend & Stats</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            {weatherDesc}
          </p>

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px' }}><BankBuilding /></div>
              <span><strong>Bank/Office</strong> (Income sources)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px' }}><RestaurantBuilding /></div>
              <span><strong>Cafe/Restaurant</strong> (Food category)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px' }}><TransportBuilding /></div>
              <span><strong>Bus Stop/Subway</strong> (Transport)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px' }}><SchoolBuilding /></div>
              <span><strong>School/Library</strong> (Education)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px' }}><MallBuilding /></div>
              <span><strong>Shopping Mall</strong> (Shopping wants)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px' }}><HospitalBuilding /></div>
              <span><strong>Hospital</strong> (Medical & Health)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px' }}><CinemaBuilding /></div>
              <span><strong>Cinema</strong> (Entertainment)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px' }}><ParkBuilding /></div>
              <span><strong>Green Garden</strong> (Positive Savings!)</span>
            </div>
          </div>

          <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '11px', textAlign: 'center' }}>
            Total Buildings Spawned: <strong>{finalBuildings.length} / 36</strong>
          </div>
        </div>

      </div>

    </div>
  );
}
