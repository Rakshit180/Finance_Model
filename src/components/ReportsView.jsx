import React, { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { jsPDF } from 'jspdf';
import { 
  FileText, 
  Sparkles, 
  Eye, 
  Download, 
  Calendar,
  AlertTriangle,
  Play,
  X
} from 'lucide-react';

export default function ReportsView({ user, transactions }) {
  const [activeTab, setActiveTab] = useState('monthly'); // monthly, quarterly, annual
  const [subscriptions, setSubscriptions] = useState([]);
  const [ghostWalletLeak, setGhostWalletLeak] = useState(0);
  
  // Wrapped slides states
  const [showWrapped, setShowWrapped] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);

  // 1. Calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filter transactions based on active Tab
  const getFilteredTxList = () => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      if (activeTab === 'monthly') {
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      } else if (activeTab === 'quarterly') {
        // Current quarter
        const currentQuarter = Math.floor(currentMonth / 3);
        const tQuarter = Math.floor(d.getMonth() / 3);
        return tQuarter === currentQuarter && d.getFullYear() === currentYear;
      } else {
        return d.getFullYear() === currentYear;
      }
    });
  };

  const periodTx = getFilteredTxList();

  const totalIncome = periodTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = periodTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Find max spending category
  const catSpending = {};
  periodTx.filter(t => t.type === 'expense').forEach(t => {
    catSpending[t.category] = (catSpending[t.category] || 0) + t.amount;
  });

  let maxCategory = 'None';
  let maxCatAmount = 0;
  Object.keys(catSpending).forEach(cat => {
    if (catSpending[cat] > maxCatAmount) {
      maxCatAmount = catSpending[cat];
      maxCategory = cat;
    }
  });

  // Find most expensive day
  const daySpending = {};
  periodTx.filter(t => t.type === 'expense').forEach(t => {
    daySpending[t.date] = (daySpending[t.date] || 0) + t.amount;
  });

  let maxDay = 'None';
  let maxDayAmount = 0;
  Object.keys(daySpending).forEach(dateStr => {
    if (daySpending[dateStr] > maxDayAmount) {
      maxDayAmount = daySpending[dateStr];
      maxDay = dateStr;
    }
  });

  // 2. Scan subscriptions & Ghost Wallet leaks
  useEffect(() => {
    // Scan all transactions for subscriptions
    const subs = transactions.filter(t => t.isSubscription && t.type === 'expense');
    // Group by unique category/title to simulate active subscriptions list
    const uniqueSubs = [];
    const seen = new Set();
    subs.forEach(s => {
      const key = `${s.category}-${s.title.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSubs.push(s);
      }
    });
    setSubscriptions(uniqueSubs);

    // Ghost Wallet: sum of 'laziness' and 'stress' motivations
    const monthlyLeak = transactions
      .filter(t => {
        const d = new Date(t.date);
        const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        return isThisMonth && t.type === 'expense' && (t.reason === 'laziness' || t.reason === 'stress');
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    setGhostWalletLeak(monthlyLeak);
  }, [transactions]);

  // 3. Spotify-Wrapped slideshow auto-advance
  useEffect(() => {
    let timer;
    if (showWrapped) {
      setSlideProgress(0);
      timer = setInterval(() => {
        setSlideProgress(prev => {
          if (prev >= 100) {
            // Next slide
            setCurrentSlide(curr => {
              if (curr < 2) return curr + 1;
              setShowWrapped(false); // Close at the end
              return 0;
            });
            return 0;
          }
          return prev + 2; // Increments 2% every 100ms (5 seconds total per slide)
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [showWrapped, currentSlide]);

  // 4. Generate & Download PDF using jsPDF
  const generatePDFReport = () => {
    const doc = new jsPDF();
    
    // Header styling
    doc.setFillColor(30, 27, 75); // Dark Purple
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("FinQuest Financial Statement", 15, 25);
    
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} • Profile: ${user.username}`, 15, 33);
    
    // Content body
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${activeTab.toUpperCase()} SUMMARY REPORT`, 15, 55);
    
    // Grid summary stats
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Income:`, 15, 65);
    doc.setFont("helvetica", "bold");
    doc.text(`INR ${totalIncome.toLocaleString()}`, 65, 65);

    doc.setFont("helvetica", "normal");
    doc.text(`Total Expenses:`, 15, 72);
    doc.setFont("helvetica", "bold");
    doc.text(`INR ${totalExpense.toLocaleString()}`, 65, 72);

    doc.setFont("helvetica", "normal");
    doc.text(`Net Savings:`, 15, 79);
    doc.setFont("helvetica", "bold");
    doc.text(`INR ${netSavings.toLocaleString()}`, 65, 79);

    doc.setFont("helvetica", "normal");
    doc.text(`Savings Percentage:`, 15, 86);
    doc.setFont("helvetica", "bold");
    doc.text(`${Math.round(savingRate)}%`, 65, 86);

    doc.setFont("helvetica", "normal");
    doc.text(`Top Spending Category:`, 15, 93);
    doc.setFont("helvetica", "bold");
    doc.text(`${maxCategory} (INR ${maxCatAmount.toLocaleString()})`, 65, 93);

    // Draw horizontal separator line
    doc.setDrawColor(229, 231, 235);
    doc.line(15, 105, 195, 105);

    // Ledger table title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TRANSACTION REGISTER", 15, 115);

    // Table headers
    let startY = 125;
    doc.setFillColor(243, 244, 246);
    doc.rect(15, startY, 180, 8, 'F');
    doc.setFontSize(9);
    doc.text("Date", 17, startY + 5);
    doc.text("Title / Category", 50, startY + 5);
    doc.text("Motivation", 120, startY + 5);
    doc.text("Amount (INR)", 193, startY + 5, { align: 'right' });

    // Table rows
    startY += 8;
    periodTx.slice(0, 15).forEach((tx) => {
      doc.setFont("helvetica", "normal");
      doc.text(tx.date, 17, startY + 5);
      doc.setFont("helvetica", "bold");
      doc.text(tx.title.substring(0, 20), 50, startY + 5);
      doc.setFont("helvetica", "normal");
      doc.text(tx.category, 50, startY + 8, { fontSize: 7 });
      
      const reasonText = tx.reason ? tx.reason : "—";
      doc.text(reasonText, 120, startY + 5);

      const amtText = `${tx.type === 'income' ? '+' : '-'} ${tx.amount.toLocaleString()}`;
      doc.text(amtText, 193, startY + 5, { align: 'right' });
      
      startY += 12;
    });

    // Save
    doc.save(`finquest_${activeTab}_report.pdf`);
  };

  return (
    <div className="dashboard-grid">
      
      {/* Reports controls */}
      <div className="col-8 glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '18px' }}>Financial Report Desk</h2>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`glass-btn-secondary ${activeTab === 'monthly' ? 'active' : ''}`}
              onClick={() => setActiveTab('monthly')}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Monthly
            </button>
            <button 
              className={`glass-btn-secondary ${activeTab === 'quarterly' ? 'active' : ''}`}
              onClick={() => setActiveTab('quarterly')}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Quarterly
            </button>
            <button 
              className={`glass-btn-secondary ${activeTab === 'annual' ? 'active' : ''}`}
              onClick={() => setActiveTab('annual')}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Annual
            </button>
          </div>
        </div>

        {/* Projections stats summary */}
        <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
          <div className="col-4" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>INCOME IN PERIOD</div>
            <strong style={{ fontSize: '20px', display: 'block', marginTop: '6px' }}>₹{totalIncome.toLocaleString()}</strong>
          </div>
          <div className="col-4" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>EXPENSES IN PERIOD</div>
            <strong style={{ fontSize: '20px', display: 'block', marginTop: '6px', color: 'var(--color-danger)' }}>₹{totalExpense.toLocaleString()}</strong>
          </div>
          <div className="col-4" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>NET SAVINGS</div>
            <strong style={{ fontSize: '20px', display: 'block', marginTop: '6px', color: netSavings >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              ₹{netSavings.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Action triggers */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={generatePDFReport} className="glass-btn" style={{ flexGrow: 1 }}>
            <Download size={16} /> Export Financial PDF
          </button>
          <button onClick={() => { setShowWrapped(true); setCurrentSlide(0); }} className="glass-btn-secondary" style={{ flexGrow: 1, borderColor: 'var(--color-primary)', color: '#fff' }}>
            <Play size={16} color="var(--color-primary)" /> Play Spotify-Wrapped Story
          </button>
        </div>

        {/* Small detail of largest expense */}
        <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '16px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Top Category Splurge:</span>
            <strong>{maxCategory} (₹{maxCatAmount.toLocaleString()})</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Most Expensive Single Day:</span>
            <strong>{maxDay} (₹{maxDayAmount.toLocaleString()})</strong>
          </div>
        </div>

      </div>

      {/* Subscription scanner & Ghost Wallet */}
      <div className="col-4 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '6px' }}>Invisible Subscriptions</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Recurring bills auto-detected by ledger</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1, maxHeight: '180px', overflowY: 'auto' }}>
          {subscriptions.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
              No active subscription detected.
            </div>
          ) : (
            subscriptions.map((sub, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.1)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{sub.title}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Annual cost: ₹{(sub.amount * 12).toLocaleString()}</div>
                </div>
                <strong style={{ fontSize: '13px', color: 'var(--color-primary)' }}>₹{sub.amount}/mo</strong>
              </div>
            ))
          )}
        </div>

        {/* Ghost Wallet indicator */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning)', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
            <AlertTriangle size={16} />
            Ghost Wallet leak
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            You spent **₹{ghostWalletLeak.toLocaleString()}** this month on **laziness & stress-relief** impulses.
            If eliminated, you save **₹{(ghostWalletLeak * 12).toLocaleString()} / year**!
          </p>
        </div>
      </div>

      {/* Wrapped Slide Deck Modal */}
      {showWrapped && (
        <div className="wrapped-modal">
          <div className="wrapped-card">
            
            {/* Top Slide indicator bars */}
            <div className="progress-bar-container">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="progress-segment">
                  <div 
                    className={`progress-fill ${idx === currentSlide ? 'active' : idx < currentSlide ? 'completed' : ''}`}
                    style={{ 
                      width: idx === currentSlide ? `${slideProgress}%` : idx < currentSlide ? '100%' : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Exit button */}
            <button 
              onClick={() => setShowWrapped(false)} 
              style={{ position: 'absolute', top: '38px', right: '32px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', zIndex: 10 }}
            >
              <X size={20} />
            </button>

            {/* Slide content */}
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', gap: '20px', zIndex: 1 }}>
              {currentSlide === 0 && (
                <div className="animate-slide-in">
                  <span style={{ fontSize: '12px', color: 'var(--color-primary)', uppercase: true, fontWeight: 'bold', letterSpacing: '0.1em' }}>THE SPLURGE</span>
                  <h2 style={{ fontSize: '32px', color: '#fff', margin: '16px 0', fontFamily: 'var(--font-heading)' }}>Top Spend</h2>
                  <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#cbd5e1' }}>
                    This month, you spent the most on <strong style={{ color: 'var(--color-danger)' }}>{maxCategory}</strong>, totalling <strong style={{ fontSize: '20px', color: '#fff', display: 'block', margin: '12px 0' }}>₹{maxCatAmount.toLocaleString()}</strong>
                    Let's review if this category represents absolute necessity or a comfort temptation!
                  </p>
                </div>
              )}

              {currentSlide === 1 && (
                <div className="animate-slide-in">
                  <span style={{ fontSize: '12px', color: 'var(--color-success)', uppercase: true, fontWeight: 'bold', letterSpacing: '0.1em' }}>SAVINGS CHAMPION</span>
                  <h2 style={{ fontSize: '32px', color: '#fff', margin: '16px 0', fontFamily: 'var(--font-heading)' }}>Frugal Power</h2>
                  <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#cbd5e1' }}>
                    Brilliant job! You saved a total of <strong style={{ fontSize: '20px', color: 'var(--color-success)', display: 'block', margin: '12px 0' }}>₹{netSavings.toLocaleString()}</strong>
                    This translates to a saving rate of **{Math.round(savingRate)}%**! Your virtual city is flourishing.
                  </p>
                </div>
              )}

              {currentSlide === 2 && (
                <div className="animate-slide-in">
                  <span style={{ fontSize: '12px', color: 'var(--color-warning)', uppercase: true, fontWeight: 'bold', letterSpacing: '0.1em' }}>DNA ANALYSIS</span>
                  <h2 style={{ fontSize: '32px', color: '#fff', margin: '16px 0', fontFamily: 'var(--font-heading)' }}>Financial DNA</h2>
                  <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#cbd5e1' }}>
                    Your money archetype is **{user.moneyDna}**.
                    Your most expensive single day was **{maxDay}** (spending ₹{maxDayAmount.toLocaleString()}).
                    Keep up the discipline and claim your legendary status!
                  </p>
                </div>
              )}
            </div>

            {/* Background design elements */}
            <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)', filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(16,185,129,0.05)', filter: 'blur(40px)', pointerEvents: 'none' }} />

          </div>
        </div>
      )}

    </div>
  );
}
