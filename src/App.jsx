import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import BudgetSimulatorView from './components/BudgetSimulatorView';
import GamificationView from './components/GamificationView';
import VirtualCityView from './components/VirtualCityView';
import ReportsView from './components/ReportsView';
import { db } from './utils/db';
import { 
  LayoutDashboard, 
  Receipt, 
  LineChart, 
  Award, 
  Map, 
  FileText, 
  LogOut, 
  Sparkles,
  Zap
} from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [levelUpMessage, setLevelUpMessage] = useState('');

  // Reload transactions when active user changes or when new transactions are logged
  const fetchTransactions = async (userId) => {
    if (!userId) return;
    const list = await db.transactions.getByUser(userId);
    setTransactions(list);
  };

  useEffect(() => {
    // Check if there was a logged-in user in localStorage
    const savedUserId = localStorage.getItem('finquest_user_id');
    if (savedUserId) {
      db.users.get(savedUserId).then((u) => {
        if (u) {
          setUser(u);
          fetchTransactions(u.id);
        }
      });
    }
  }, []);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem('finquest_user_id', loggedInUser.id);
    fetchTransactions(loggedInUser.id);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('finquest_user_id');
    setActiveView('dashboard');
  };

  // Centralized method to award XP and check for level-ups
  const awardXP = async (amount) => {
    if (!user) return;
    const updatedUser = { ...user };
    updatedUser.xp += amount;
    
    // Level up calculation: e.g. 500 XP per level
    const xpNeeded = updatedUser.level * 500;
    if (updatedUser.xp >= xpNeeded) {
      updatedUser.level += 1;
      updatedUser.xp = updatedUser.xp - xpNeeded; // carry over
      setLevelUpMessage(`CONGRATULATIONS! You leveled up to Level ${updatedUser.level}!`);
      setTimeout(() => setLevelUpMessage(''), 5000);
    }

    await db.users.put(updatedUser);
    setUser(updatedUser);
  };

  const triggerUpdateUser = async (updatedUser) => {
    await db.users.put(updatedUser);
    setUser(updatedUser);
  };

  if (!user) {
    return <Onboarding onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <Sparkles size={16} color="#fff" />
          </div>
          <span className="brand-name">FinQuest</span>
        </div>

        <nav>
          <ul className="nav-links">
            <li>
              <div 
                className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveView('dashboard')}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </div>
            </li>
            <li>
              <div 
                className={`nav-item ${activeView === 'transactions' ? 'active' : ''}`}
                onClick={() => setActiveView('transactions')}
              >
                <Receipt size={18} />
                Transactions
              </div>
            </li>
            <li>
              <div 
                className={`nav-item ${activeView === 'budget' ? 'active' : ''}`}
                onClick={() => setActiveView('budget')}
              >
                <LineChart size={18} />
                Budget & Simulator
              </div>
            </li>
            <li>
              <div 
                className={`nav-item ${activeView === 'gamification' ? 'active' : ''}`}
                onClick={() => setActiveView('gamification')}
              >
                <Award size={18} />
                Gamification & Splits
              </div>
            </li>
            <li>
              <div 
                className={`nav-item ${activeView === 'city' ? 'active' : ''}`}
                onClick={() => setActiveView('city')}
              >
                <Map size={18} />
                Virtual City
              </div>
            </li>
            <li>
              <div 
                className={`nav-item ${activeView === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveView('reports')}
              >
                <FileText size={18} />
                Reports & Wrapped
              </div>
            </li>
          </ul>
        </nav>

        {/* Sidebar Profile Card & Logout */}
        <div className="user-profile-section">
          <div className="avatar">
            {user.username.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.username}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Zap size={10} color="var(--color-warning)" />
              Lvl {user.level} ({user.xp} XP)
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            title="Log Out / Switch Profile"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {levelUpMessage && (
          <div 
            className="glass-panel"
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 1000,
              padding: '16px 24px',
              background: 'linear-gradient(135deg, var(--color-primary), #6d28d9)',
              borderColor: 'var(--color-primary)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <Zap size={20} color="#fff" className="animate-float" />
            <div style={{ fontWeight: 'bold', color: '#fff' }}>{levelUpMessage}</div>
          </div>
        )}

        <div className="animate-slide-in">
          {activeView === 'dashboard' && (
            <DashboardView 
              user={user} 
              transactions={transactions} 
              onRefreshTransactions={() => fetchTransactions(user.id)}
            />
          )}

          {activeView === 'transactions' && (
            <TransactionsView 
              user={user} 
              transactions={transactions} 
              onRefreshTransactions={() => fetchTransactions(user.id)}
              awardXP={awardXP}
            />
          )}

          {activeView === 'budget' && (
            <BudgetSimulatorView 
              user={user} 
              transactions={transactions}
              onUpdateUser={triggerUpdateUser}
              awardXP={awardXP}
            />
          )}

          {activeView === 'gamification' && (
            <GamificationView 
              user={user} 
              transactions={transactions}
              onUpdateUser={triggerUpdateUser}
              awardXP={awardXP}
            />
          )}

          {activeView === 'city' && (
            <VirtualCityView 
              user={user} 
              transactions={transactions} 
            />
          )}

          {activeView === 'reports' && (
            <ReportsView 
              user={user} 
              transactions={transactions} 
            />
          )}
        </div>
      </main>
    </div>
  );
}
