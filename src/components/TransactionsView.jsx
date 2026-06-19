import React, { useState } from 'react';
import { db } from '../utils/db';
import { Plus, Search, Trash2, Image, FileText, X, Filter } from 'lucide-react';

const STUDENT_CATEGORIES = {
  income: ["Pocket Money", "Scholarship", "Parents Transfer", "Part-Time Job", "Internship Stipend", "Cashback/Rewards", "Friends Borrowed", "Other Income"],
  expense: ["Hostel Fee / Rent", "Mess / Food", "Stationery / Books", "Recreation / Movie", "Shopping", "Medical / Health", "Utilities (WiFi)", "Borrowed Return", "Miscellaneous"]
};

const PROFESSIONAL_CATEGORIES = {
  income: ["Salary", "Business Revenue", "Investment Dividends", "Freelance Gig", "Rental Income", "Other Income"],
  expense: ["Housing Rent / EMI", "Groceries / Food", "Tax / Professional Tax", "Insurance Premiums", "Investment Contribution", "Shopping", "Entertainment / Dining", "Transport / Fuel", "Utilities (Electricity)", "Miscellaneous"]
};

export default function TransactionsView({ user, transactions, onRefreshTransactions, awardXP }) {
  const isStudent = user.userType === 'Student';
  const categories = isStudent ? STUDENT_CATEGORIES : PROFESSIONAL_CATEGORIES;

  // Form states
  const [type, setType] = useState('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(categories[type][0]);
  const [reason, setReason] = useState('necessity'); // necessity, happiness, stress, celebration, laziness
  const [receiptBase64, setReceiptBase64] = useState('');
  const [isSubscription, setIsSubscription] = useState(false);

  // Filters states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterReason, setFilterReason] = useState('all');

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Auto update category when type switches
  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory(categories[newType][0]);
  };

  // Convert uploaded image to base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    // Smart detector: check if title or category suggests subscription
    const titleLower = title.toLowerCase();
    const isSub = isSubscription || 
      titleLower.includes('netflix') || 
      titleLower.includes('spotify') || 
      titleLower.includes('youtube premium') || 
      titleLower.includes('subscription') || 
      titleLower.includes('recurring') || 
      category.toLowerCase().includes('wifi');

    const newTx = {
      id: `${user.id}-${Date.now()}`,
      userId: user.id,
      type,
      title: title.trim(),
      amount: parsedAmount,
      date,
      category,
      reason: type === 'expense' ? reason : null,
      receiptImage: type === 'expense' ? receiptBase64 : null,
      isSubscription: isSub
    };

    await db.transactions.put(newTx);
    
    // Award XP
    await awardXP(15);
    
    // Reset Form
    setTitle('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory(categories[type][0]);
    setReason('necessity');
    setReceiptBase64('');
    setIsSubscription(false);

    // Refresh app list
    onRefreshTransactions();
  };

  const handleDeleteTransaction = async (txId) => {
    if (!window.confirm("Are you sure you want to delete this transaction? (Deducts 15 XP)")) return;
    await db.transactions.delete(txId);
    await awardXP(-15);
    onRefreshTransactions();
  };

  // Filter list
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' ? true : t.type === filterType;
    const matchesCategory = filterCategory === 'all' ? true : t.category === filterCategory;
    const matchesReason = filterReason === 'all' ? true : t.reason === filterReason;

    return matchesSearch && matchesType && matchesCategory && matchesReason;
  });

  return (
    <div className="dashboard-grid">
      
      {/* Add Transaction Box */}
      <div className="col-4 glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Log New Transaction</h2>
        
        <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Toggle Type */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`glass-btn-secondary ${type === 'expense' ? 'active' : ''}`}
              onClick={() => handleTypeChange('expense')}
              style={{ flexGrow: 1, borderColor: type === 'expense' ? 'var(--color-danger)' : '' }}
            >
              Expense
            </button>
            <button
              type="button"
              className={`glass-btn-secondary ${type === 'income' ? 'active' : ''}`}
              onClick={() => handleTypeChange('income')}
              style={{ flexGrow: 1, borderColor: type === 'income' ? 'var(--color-success)' : '' }}
            >
              Income
            </button>
          </div>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Title / Description</label>
            <input
              type="text"
              placeholder="e.g. Weekly Groceries"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          {/* Amount */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Amount (₹)</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          {/* Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          {/* Category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="glass-input"
            >
              {categories[type].map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Expense Reason (Specific to Expense Type) */}
          {type === 'expense' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Why are you buying this? (Motivation)</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="glass-input"
              >
                <option value="necessity">Necessity (Needs, rent, utility)</option>
                <option value="happiness">Happiness (Wants, self-care, hobbies)</option>
                <option value="stress">Stress Relief (Impulsive stress purchase)</option>
                <option value="celebration">Celebration (Gifts, group dining)</option>
                <option value="laziness">Laziness (Taxis, delivery, convenience)</option>
              </select>
            </div>
          )}

          {/* Subscription toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              id="sub-checkbox"
              checked={isSubscription}
              onChange={(e) => setIsSubscription(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="sub-checkbox" style={{ fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Is this a recurring subscription?
            </label>
          </div>

          {/* Receipt Upload (Specific to Expense) */}
          {type === 'expense' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Image size={14} /> Upload Receipt / Bill
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
              />
              {receiptBase64 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <img src={receiptBase64} alt="Receipt preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-glass)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--color-success)' }}>Attached!</span>
                  <button type="button" onClick={() => setReceiptBase64('')} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', marginLeft: 'auto' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="glass-btn" style={{ marginTop: '8px' }}>
            <Plus size={16} /> Log transaction (+15 XP)
          </button>
        </form>
      </div>

      {/* Transactions Ledger List */}
      <div className="col-8 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Tools */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '18px' }}>Transaction History Ledger</h2>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '4px 10px', width: '220px' }}>
            <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '12px' }}
            />
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <Filter size={12} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-secondary)' }}>Filters:</span>
          </div>

          {/* Type Filter */}
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="glass-input" 
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Incomes Only</option>
          </select>

          {/* Category Filter */}
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="glass-input" 
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            <option value="all">All Categories</option>
            {[...categories.income, ...categories.expense].map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Reason Filter */}
          <select 
            value={filterReason} 
            onChange={(e) => setFilterReason(e.target.value)}
            className="glass-input" 
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            <option value="all">All Motivations</option>
            <option value="necessity">Necessity</option>
            <option value="happiness">Happiness</option>
            <option value="stress">Stress Relief</option>
            <option value="celebration">Celebration</option>
            <option value="laziness">Laziness</option>
          </select>

        </div>

        {/* List Table */}
        <div style={{ overflowX: 'auto' }}>
          {filteredTransactions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No transactions matches your criteria.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 8px' }}>Date</th>
                  <th style={{ padding: '12px 8px' }}>Title</th>
                  <th style={{ padding: '12px 8px' }}>Category</th>
                  <th style={{ padding: '12px 8px' }}>Motivation</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Receipt</th>
                  <th style={{ padding: '12px 8px', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', hover: { background: 'rgba(255,255,255,0.01)' } }}>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '12px' }}>{tx.date}</td>
                    <td style={{ padding: '12px 8px', fontWeight: '500' }}>
                      {tx.title}
                      {tx.isSubscription && (
                        <span style={{ marginLeft: '6px', fontSize: '9px', background: 'var(--color-primary-glow)', border: '1px solid var(--color-primary)', borderRadius: '4px', padding: '1px 4px', color: '#fff' }}>
                          SUB
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ background: tx.type === 'income' ? 'var(--color-success-glow)' : 'rgba(255,255,255,0.03)', border: '1px solid', borderColor: tx.type === 'income' ? 'var(--color-success)' : 'var(--border-glass)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px' }}>
                        {tx.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {tx.reason ? (
                        <span style={{
                          fontSize: '11px',
                          color: tx.reason === 'necessity' ? 'var(--color-info)' : 
                                 tx.reason === 'happiness' ? 'var(--color-success)' : 
                                 tx.reason === 'stress' ? 'var(--color-danger)' : 
                                 tx.reason === 'celebration' ? 'var(--color-warning)' : 
                                 'var(--text-muted)'
                        }}>
                          {tx.reason.charAt(0).toUpperCase() + tx.reason.slice(1)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: tx.type === 'income' ? 'var(--color-success)' : 'var(--text-primary)' }}>
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      {tx.receiptImage ? (
                        <button 
                          onClick={() => setSelectedReceipt(tx.receiptImage)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'inline-flex', padding: '4px' }}
                          title="View Receipt"
                        >
                          <FileText size={16} />
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteTransaction(tx.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        title="Delete record"
                      >
                        <Trash2 size={14} hover={{ color: 'var(--color-danger)' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Receipt Image Lightbox Modal */}
      {selectedReceipt && (
        <div className="wrapped-modal" onClick={() => setSelectedReceipt(null)}>
          <div 
            className="glass-panel" 
            style={{ 
              maxWidth: '500px', 
              width: '90%', 
              padding: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedReceipt(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '18px' }}>Receipt / Bill Document</h3>
            <img 
              src={selectedReceipt} 
              alt="Receipt Document" 
              style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-glass)' }} 
            />
          </div>
        </div>
      )}

    </div>
  );
}
